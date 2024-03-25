
from django.urls import path
from .views import *
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [

    path('login/', user_login, name='login'),
    path('logout/', user_logout, name='logout'),
    path('register/', user_register, name='register'),

    path('', worldapp, name='worldapp'),
    path('update_location/', update_location, name="update_location"),
    path('profile_settings/', profile_settings, name='profile_settings')

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
