from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    # Provide token login endpoint for initial testing
    path('token/', obtain_auth_token, name='api_token_auth'),
]
