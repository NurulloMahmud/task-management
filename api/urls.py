from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import (
    RegisterView,
    TaskListCreateView,
    TaskUpdateDeleteView,
)


urlpatterns = [
    path("login", TokenObtainPairView.as_view()),
    path("register", RegisterView.as_view()),
    path("tasks", TaskListCreateView.as_view()),
    path("tasks/<int:id>", TaskUpdateDeleteView.as_view()),
]