from django.contrib.auth import get_user_model
from rest_framework import generics, permissions

from .serializers import UserSerializer

User = get_user_model()


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
