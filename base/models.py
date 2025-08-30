from django.db import models

# Create your models here.

class RoomMember(models.Model):
    name = models.CharField(max_length=200)
    uid= models.CharField(max_length=200)
    room_name= models.CharField(max_length=200)

    def __str__(self) -> str:
        return self.name


class Chat(models.Model):
    room= models.ForeignKey(RoomMember, on_delete=models.CASCADE)
    message= models.TextField()
    timestamp= models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.room.name}: {self.message[:50]}..."

