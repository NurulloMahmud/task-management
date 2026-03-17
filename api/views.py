from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

from .models import Task
from .serializers import (
    RegisterSerializer,
    TaskCreateSerializer,
    TaskViewSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            "user": {
                "username": user.username,
                "email": user.email,
            },
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(owner=request.user)
        serializer = TaskViewSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(owner=request.user)
        return Response(TaskViewSerializer(task).data, status=status.HTTP_201_CREATED)


class TaskUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Task.objects.get(pk=pk, owner=user)
        except Task.DoesNotExist:
            return None

    def put(self, request, id):
        task = self.get_object(id, request.user)
        if not task:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskCreateSerializer(task, data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskViewSerializer(task).data)

    def delete(self, request, id):
        task = self.get_object(id, request.user)
        if not task:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
