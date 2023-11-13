import json
from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.gis.geos import Point
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import *

from .forms import UserLoginForm, UserRegisterForm

def user_register(request):
    if request.user.is_authenticated:
        return redirect('worldapp')
    else:
        if request.method == 'POST':
            form = UserRegisterForm(request.POST)
            if form.is_valid():
                user = form.save()
                login(request, user)
                messages.success(request, 'User Registration Successful!')
                return redirect('worldapp')
            else:
                messages.error(request, 'Error: Something Went Wrong.')
        else:
            form = UserRegisterForm()

        return render(request, 'worldapp/register.html', {'form': form})
def user_login(request):
    if request.user.is_authenticated:
        return redirect('worldapp')
    else:
        if request.method == 'POST':
            form = UserLoginForm(data=request.POST)
            if form.is_valid():
                user = form.get_user()
                login(request, user)
                return redirect('worldapp')
        else:
            form = UserLoginForm()

        return render(request, 'worldapp/login.html', {'form': form})

def user_logout(request):
    logout(request)
    return redirect('login')

def worldapp(request):
    if not request.user.is_authenticated:
        return redirect('login')
    else:
        context = {'title': 'AWMCA Map'}
        return render(request, 'worldapp/worldapp.html', context)

def update_location(request):
    data = json.loads(request.body)
    lat = data['latitude']
    lng = data['longitude']

    request.user.last_location = Point(lng, lat)

    request.user.save()
    request.user.refresh_from_db()

    return JsonResponse('Item Added', safe=False)


