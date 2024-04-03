import json
from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.gis.geos import Point
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user
from django.db.models import Q
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import *
from django import forms
from .forms import UserLoginForm, UserRegisterForm, UsernameUpdateForm, CustomPasswordChangeForm, PubForm
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Pub
from django.shortcuts import get_object_or_404




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

def discover(request):
    allSongs = Song.objects.all().order_by('-last_updated')
    return render(request, template_name="worldapp/discover.html", context={"allSongs" : allSongs})


@login_required
def profile_settings(request):
    if request.method == 'POST':
        user_form = UsernameUpdateForm(request.POST, request.FILES, instance=request.user)
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

    # Get the favourite pubs of the current user
    favourite_pubs = Pub.objects.filter(favourite__user=request.user)

    return render(request, 'worldapp/profile_settings.html', {
        'user_form': user_form,
        'password_form': password_form,
        'favourite_pubs': favourite_pubs
    })

def worldapp(request):
    if not request.user.is_authenticated:
        return redirect('login')
    else:
        context = {'title': 'AWMCA Map'}
        return render(request, 'worldapp/worldapp.html', context)

# def update_location(request):
#     data = json.loads(request.body)
#     lat = data.get('latitude')
#     lng = data.get('longitude')
#
#     if lat is None or lng is None:
#         return JsonResponse({'error': 'Latitude or longitude missing in request'}, status=400)
#
#     request.user.last_location = Point(lng, lat)
#
#     request.user.save()
#     request.user.refresh_from_db()
#
#     return JsonResponse('Item Added', safe=False)


def is_admin(user):
    return user.is_superuser  # or any other condition you want to check

@login_required
@user_passes_test(is_admin)
def update(request):
    return render(request, 'worldapp/update.html')

@user_passes_test(is_admin)
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

@user_passes_test(is_admin)
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


@login_required
def toggle_favourite(request, pub_id):
    # Get the pub instance
    pub = Pub.objects.get(id=pub_id)

    # Check if the pub is already favorited by the user
    favourite = Favourite.objects.filter(user=request.user, pub=pub).first()

    # If the pub was already favorited, remove it from favorites
    if favourite:
        favourite.delete()
        status = 'removed'
    else:
        # Create a new favourite
        Favourite.objects.create(user=request.user, pub=pub)
        status = 'added'

    return JsonResponse({'status': status})

def discover_artists(request):
    artists = Artist.objects.all().prefetch_related('album_set', 'album_set__song_set')

    context = {
        'artists': artists,
    }
    return render(request, 'worldapp/discover.html', context)


def search_songs(request):

    search_query = request.GET.get('search', None)

    if search_query:
        search_result = Song.objects.filter(
            Q(songName__icontains=search_query) |
            Q(album__albumName__icontains=search_query) |
            Q(album__artist__artistName__icontains=search_query)
        ).distinct()
    else:
        search_result = Song.objects.all()

    context = {'search_result': search_result, 'search_query': search_query}
    return render(request, 'worldapp/search_results.html', context)



@login_required
def record_play(request, song_id):
    # Get the song instance
    song = get_object_or_404(Song, id=song_id)

    # Create a new Play instance
    user = get_user(request)  # Get the User instance
    play = Play(user=user, song=song)
    play.save()

    return JsonResponse({'status': 'success'})