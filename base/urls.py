from django.urls import path
from .import views

urlpatterns=[
    path('', views.lobby),
    path('room/', views.room),
    path('get_token/', views.getToken),

    path('create_member/', views.createMember),
    path('get_member/', views.getMember),
    path('delete_member/', views.deleteMember),
    path('set_sharer/', views.set_sharer, name='set_sharer'),
    path('get_sharer/', views.get_sharer, name='get_sharer'),
    path('remove_sharer/', views.remove_sharer, name='remove_sharer'),


]