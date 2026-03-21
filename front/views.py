from django.shortcuts import render


def auth_view(request):
    return render(request, "front/auth.html")


def board_view(request):
    return render(request, "front/board.html")