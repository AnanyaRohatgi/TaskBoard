from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Board(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class List(models.Model):
    board = models.ForeignKey(Board, related_name='lists', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    position = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.board.title} - {self.title}"

class Label(models.Model):
    board = models.ForeignKey(Board, related_name='labels', on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#cccccc')

class Card(models.Model):
    list = models.ForeignKey(List, related_name='cards', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    position = models.IntegerField(default=0)
    due_date = models.DateTimeField(null=True, blank=True)
    labels = models.ManyToManyField(Label, blank=True)
    assignees = models.ManyToManyField(User, blank=True)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position']

    def __str__(self):
        return self.title

class ChecklistItem(models.Model):
    card = models.ForeignKey(Card, related_name='checklist', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    done = models.BooleanField(default=False)

class Comment(models.Model):
    card = models.ForeignKey(Card, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class CardActivity(models.Model):
    card = models.ForeignKey(Card, related_name='activity', on_delete=models.CASCADE)
    type = models.CharField(max_length=50)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
