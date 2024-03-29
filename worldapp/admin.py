from django.contrib import admin

from .models import Artist, Song, Album, Pub, User, Favourite


@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ("id", "artistName", "created", "last_updated")

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ("id", "album", "song", "songName", "songThumbnail", "created", "last_updated" )

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ("artist", "albumName", "created", "last_updated")

@admin.register(Pub)
class PubAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "amenity", "addr_city", "addr_country", "addr_county", "addr_housename", "addr_housenumber", "postcode", "addr_street", "phone", "website", "wheelchair", "location", "artist")

class FavouriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'pub')

admin.site.register(Favourite, FavouriteAdmin)