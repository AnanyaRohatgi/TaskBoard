from rest_framework import routers
from django.urls import path, include
from .views import BoardViewSet, ListViewSet, CardViewSet

router = routers.DefaultRouter()
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'lists', ListViewSet, basename='list')
router.register(r'cards', CardViewSet, basename='card')

urlpatterns = [
    path('', include(router.urls)),
]
