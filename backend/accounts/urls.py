from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

from .views import UserListView

urlpatterns = [
    # Provide token login endpoint for initial testing
    path('token/', obtain_auth_token, name='api_token_auth'),
    path('users/', UserListView.as_view(), name='user-list'),
]
