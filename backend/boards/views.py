from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.db import models
from .models import Board, List, Card
from .serializers import BoardSerializer, ListSerializer, CardSerializer

class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all().order_by('-created_at')
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all().order_by('position')
    serializer_class = ListSerializer
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

        # If neither list nor position provided, proceed with default update
        if new_list_id is None and new_position is None:
            return super().update(request, *args, **kwargs)

        try:
            with transaction.atomic():
                old_list = instance.list
                old_position = instance.position

                # If list provided, resolve the target list
                if new_list_id is not None:
                    try:
                        target_list = List.objects.get(pk=int(new_list_id))
                    except (List.DoesNotExist, ValueError):
                        return Response({'detail': 'Target list does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    target_list = old_list

                # Determine new position (if not provided, append to end)
                if new_position is None:
                    # append to end of target list
                    max_pos = Card.objects.filter(list=target_list).aggregate(max_pos=models.Max('position'))['max_pos']
                    new_position = (max_pos + 1) if max_pos is not None else 0
                else:
                    new_position = int(new_position)

                # If moving to a different list
                if target_list.pk != old_list.pk:
                    # Shift down positions in target list for cards at >= new_position
                    Card.objects.filter(list=target_list, position__gte=new_position).update(position=models.F('position') + 1)
                    # Shift up positions in old list for cards after old_position
                    Card.objects.filter(list=old_list, position__gt=old_position).update(position=models.F('position') - 1)
                    # Apply changes to instance
                    instance.list = target_list
                    instance.position = new_position
                    instance.save()
                else:
                    # Reordering within same list
                    if new_position < old_position:
                        # moved up: increment positions of intervening cards
                        Card.objects.filter(list=old_list, position__gte=new_position, position__lt=old_position).update(position=models.F('position') + 1)
                    elif new_position > old_position:
                        # moved down: decrement positions of intervening cards
                        Card.objects.filter(list=old_list, position__lte=new_position, position__gt=old_position).update(position=models.F('position') - 1)
                    instance.position = new_position
                    instance.save()

                # Proceed to run serializer update for other fields if present
                serializer = self.get_serializer(instance, data=data, partial=partial)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)

                return Response(serializer.data)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
