
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
    path('update/', update, name="update"),
    path('profile_settings/', profile_settings, name='profile_settings'),

    path('', worldapp, name='worldapp'),
    # path('update_location/', update_location, name="update_location"),
    path('search_pubs/', search_pubs, name='search_pubs'),
    path('search_artists/', search_artists, name='search_artists'),
    path('edit_pub/<path:pub_id>/', edit_pub, name='edit_pub'),
    path('pubs_geojson/', PubsGeoJSON.as_view(), name='pubs_geojson'),
    path('toggle_favourite/<int:pub_id>/', toggle_favourite, name='toggle_favourite'),





] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
