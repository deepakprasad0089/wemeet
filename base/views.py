from django.shortcuts import render
from django.http import JsonResponse
from agora_token_builder import RtcTokenBuilder
import random
import time
import json
from .models import RoomMember

from django.views.decorators.csrf import csrf_exempt
#Build token with uid

# Create your views here.

def getToken(request):
    appId='5debee1e17e14c90a7847910b5732dbf'
    appCertificate='27b6cc519b744f4ab5930b5bfa371264'
    channelName = request.GET.get('channel')
    uid= random.randint(1,230)
    expirationTimeInSeconds=3600*24
    currentTimeStamp=time.time()
    privilegeExpiredTs=currentTimeStamp + expirationTimeInSeconds
    role = 1
    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token':token, 'uid':uid,},safe=False)

def lobby(request):
    return render(request,'base/lobby.html')



def room(request, room_name):
    return render(request, 'base/room.html', {'room_name': room_name})



@csrf_exempt
def createMember(request):
    data = json.loads(request.body)
    member, created = RoomMember.objects.get_or_create(
        name=data['name'],
        uid=data['UID'],
        room_name=data['room_name']
    )

    return JsonResponse({'name':data['name']}, safe=False)


def getMember(request):
    uid = request.GET.get('UID')
    room_name = request.GET.get('room_name')

    member = RoomMember.objects.get(
        uid=uid,
        room_name=room_name,
    )
    name = member.name
    return JsonResponse({'name':member.name}, safe=False)

@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)
    member = RoomMember.objects.get(
        name=data['name'],
        uid=data['UID'],
        room_name=data['room_name']
    )
    member.delete()
    return JsonResponse('Member deleted', safe=False)




sharers = {}  # simple in-memory dict: {room_name: sharer_UID}

@csrf_exempt
def set_sharer(request):
    if request.method == "POST":
        data = json.loads(request.body)
        room_name = data.get("room_name")
        uid = data.get("UID")
        sharers[room_name] = uid
        return JsonResponse({"success": True})
    
@csrf_exempt
def get_sharer(request):
    room_name = request.GET.get("room_name")
    uid = sharers.get(room_name)
    return JsonResponse({"sharerId": uid})


@csrf_exempt
def remove_sharer(request):
    if request.method == "POST":
        data = json.loads(request.body)
        room_name = data.get("room_name")
        if room_name in sharers:
            del sharers[room_name]
        return JsonResponse({"success": True})
