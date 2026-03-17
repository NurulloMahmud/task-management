from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TaskStatus(models.TextChoices):
    TODO = "todo", "To Do"
    IN_PROGRESS = 'in_progress', 'In Progress'
    DONE = 'done', 'Done'


class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )

    class Meta:
        db_table = "tasks"