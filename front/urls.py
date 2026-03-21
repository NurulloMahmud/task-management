from django.urls import path
from . import views

urlpatterns = [
    path("", views.auth_view, name="auth"),
    path("board/", views.board_view, name="board"),
]