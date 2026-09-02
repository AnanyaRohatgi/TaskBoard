from django.contrib import admin
from .models import Board, List, Card, Label, Comment, ChecklistItem, CardActivity

admin.site.register(Board)
admin.site.register(List)
admin.site.register(Card)
admin.site.register(Label)
admin.site.register(Comment)
admin.site.register(ChecklistItem)
admin.site.register(CardActivity)
