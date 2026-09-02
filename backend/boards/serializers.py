from rest_framework import serializers
from .models import Board, List, Card, Label, Comment, ChecklistItem
from django.contrib.auth import get_user_model

User = get_user_model()

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id', 'text', 'done']

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'text', 'created_at']

class CardSerializer(serializers.ModelSerializer):
    checklist = ChecklistItemSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    labels = serializers.PrimaryKeyRelatedField(many=True, queryset=Label.objects.all(), required=False)
    assignees = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)
    list = serializers.PrimaryKeyRelatedField(queryset=List.objects.all())

    class Meta:
        model = Card
        fields = ['id', 'list', 'title', 'description', 'position', 'due_date', 'labels', 'assignees', 'checklist', 'comments']

class ListSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = ['id', 'board', 'title', 'position', 'cards']

class BoardSerializer(serializers.ModelSerializer):
    lists = ListSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id', 'title', 'description', 'archived', 'created_at', 'lists']
