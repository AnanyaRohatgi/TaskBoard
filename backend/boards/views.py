from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.db import models
from .models import Board, List, Card, Label, Comment, ChecklistItem, CardActivity
from .serializers import BoardSerializer, ListSerializer, CardSerializer, LabelSerializer, CommentSerializer, ChecklistItemSerializer


class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all().order_by('-created_at')
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all().order_by('position')
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def update(self, request, *args, **kwargs):
        """
        Reindex sibling lists when a list is moved to a new position.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        new_position = request.data.get('position', None)

        if new_position is None:
            return super().update(request, *args, **kwargs)

        try:
            with transaction.atomic():
                old_position = instance.position
                board = instance.board
                new_position = int(new_position)

                if new_position < 0:
                    return Response({'detail': 'List position must be non-negative.'}, status=status.HTTP_400_BAD_REQUEST)

                if new_position == old_position:
                    serializer = self.get_serializer(instance, data=request.data, partial=partial)
                    serializer.is_valid(raise_exception=True)
                    self.perform_update(serializer)
                    return Response(serializer.data)

                if new_position < old_position:
                    List.objects.filter(board=board, position__gte=new_position, position__lt=old_position).update(position=models.F('position') + 1)
                elif new_position > old_position:
                    List.objects.filter(board=board, position__lte=new_position, position__gt=old_position).update(position=models.F('position') - 1)

                instance.position = new_position
                instance.save()

                serializer = self.get_serializer(instance, data=request.data, partial=partial)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(serializer.data)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all().order_by('name')
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            card = Card.objects.get(pk=request.data.get('card'))
            CardActivity.objects.create(card=card, type='comment', payload={'user': request.user.username, 'text': request.data.get('text', '')})
        return response


class ChecklistItemViewSet(viewsets.ModelViewSet):
    queryset = ChecklistItem.objects.all().order_by('id')
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all().order_by('position')
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def update(self, request, *args, **kwargs):
        """
        Override update to adjust positions of other cards when a card is moved or reordered.
        Accepts 'list' (id) and 'position' (int) in the payload.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data

        new_list_id = data.get('list', None)
        new_position = data.get('position', None)

        if new_list_id is None and new_position is None:
            return super().update(request, *args, **kwargs)

        try:
            with transaction.atomic():
                old_list = instance.list
                old_position = instance.position

                if new_list_id is not None:
                    try:
                        target_list = List.objects.get(pk=int(new_list_id))
                    except (List.DoesNotExist, ValueError):
                        return Response({'detail': 'Target list does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    target_list = old_list

                if new_position is None:
                    max_pos = Card.objects.filter(list=target_list).aggregate(max_pos=models.Max('position'))['max_pos']
                    new_position = (max_pos + 1) if max_pos is not None else 0
                else:
                    new_position = int(new_position)

                if target_list.pk != old_list.pk:
                    Card.objects.filter(list=target_list, position__gte=new_position).update(position=models.F('position') + 1)
                    Card.objects.filter(list=old_list, position__gt=old_position).update(position=models.F('position') - 1)
                    instance.list = target_list
                    instance.position = new_position
                    instance.save()
                else:
                    if new_position < old_position:
                        Card.objects.filter(list=old_list, position__gte=new_position, position__lt=old_position).update(position=models.F('position') + 1)
                    elif new_position > old_position:
                        Card.objects.filter(list=old_list, position__lte=new_position, position__gt=old_position).update(position=models.F('position') - 1)
                    instance.position = new_position
                    instance.save()

                serializer = self.get_serializer(instance, data=data, partial=partial)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)

                return Response(serializer.data)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
