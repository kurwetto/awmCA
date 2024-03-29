import json
from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.gis.geos import Point
from django.db.models import Q
from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import *
from django import forms
from .forms import UserLoginForm, UserRegisterForm, UsernameUpdateForm, CustomPasswordChangeForm, PubForm
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Pub


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



@login_required
def profile_settings(request):
    if request.method == 'POST':
        user_form = UsernameUpdateForm(request.POST, instance=request.user)
        if 'change_password' in request.POST:
            password_form = CustomPasswordChangeForm(request.user, request.POST)
            if password_form.is_valid():
                password_form.save()
                messages.success(request, 'Your password was successfully updated!')
        if user_form.is_valid():
            user_form.save()
            messages.success(request, 'Your username was successfully updated!')
            return redirect('profile_settings')
        else:
            messages.error(request, 'Please correct the error below.')
    else:
        user_form = UsernameUpdateForm(instance=request.user)
        password_form = CustomPasswordChangeForm(request.user)
    return render(request, 'worldapp/profile_settings.html', {'user_form': user_form, 'password_form': password_form})

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

def is_admin(user):
    return user.is_superuser  # or any other condition you want to check

@login_required
@user_passes_test(is_admin)
def update(request):
    return render(request, 'worldapp/update.html')

def search_pubs(request):
    query = request.GET.get('q')
    pubs = None
    if query:
        pubs = Pub.objects.filter(Q(name__icontains=query))
        # Create a form for each pub
        for pub in pubs:
            pub.form = PubForm(instance=pub)
    else:
        pubs = Pub.objects.none()

    context = {
        'pubs': pubs,
    }
    return render(request, 'worldapp/update.html', context)
def search_artists(request):
    query = request.GET.get('q')
    artists = None
    if query:
        artists = Artist.objects.filter(Q(artistName__icontains=query)).prefetch_related('album_set', 'album_set__song_set')
    else:
        artists = Artist.objects.none()

    context = {
        'artists': artists,
    }
    return render(request, 'worldapp/update.html', context)

def edit_pub(request, pub_id):
    pub = Pub.objects.get(id=pub_id)
    if request.method == 'POST':
        form = PubForm(request.POST, instance=pub)
        if form.is_valid():
            form.save()
            return redirect('update')
        else:
            print(form.errors)  # Print form errors
    else:
        form = PubForm(instance=pub)
    return render(request, 'worldapp/update.html', {'form': form})
class PubsGeoJSON(APIView):
    def get(self, request):
        pubs = Pub.objects.all()
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [pub.location.x, pub.location.y],
                    },
                    "properties": {
                        "id": pub.id,
                        "amenity": pub.amenity,
                        "name": pub.name,
                        "addr_city": pub.addr_city,
                        "addr_country": pub.addr_country,
                        "addr_county": pub.addr_county,
                        "addr_housename": pub.addr_housename,
                        "addr_housenumber": pub.addr_housenumber,
                        "postcode": pub.postcode,
                        "addr_street": pub.addr_street,
                        "phone": pub.phone,
                        "website": pub.website,
                        "wheelchair": pub.wheelchair,
                        "artist": pub.artist.artistName if pub.artist else None,
                        "songURL": pub.songURL,
                    },
                }
                for pub in pubs
            ],
        }
        return Response(geojson)
