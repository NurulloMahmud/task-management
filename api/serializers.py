from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Task


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class TaskOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")


class TaskViewSerializer(serializers.ModelSerializer):
    owner = TaskOwnerSerializer(read_only=True)
    
    class Meta:
        model = Task
        fields = "__all__"


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ("title", "description", "status")
