from rest_framework import routers
from django.urls import path, include
from .views import BoardViewSet, ListViewSet, CardViewSet, LabelViewSet, CommentViewSet, ChecklistItemViewSet

router = routers.DefaultRouter()
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'lists', ListViewSet, basename='list')
router.register(r'cards', CardViewSet, basename='card')
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'checklist', ChecklistItemViewSet, basename='checklist-item')

urlpatterns = [
    path('', include(router.urls)),
]
