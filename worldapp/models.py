from django.conf import settings
from django.utils import timezone
from django.contrib.gis.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser

User = settings.AUTH_USER_MODEL

class UserManager(BaseUserManager):
    def create_user(self, email, password=None):
        """ Create and Save a User with the given Email and Password. """
        if not email:
            raise ValueError('Users must have an Email Address.')

        user = self.model(
            email=self.normalize_email(email),
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_staffuser(self, email, password):
        """ Create and Save a Staff User with the given Email and Password. """
        user = self.create_user(email=email, password=password)
        user.staff = True
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        """ Create and Save a Super User with the given Email and Password. """
        user = self.create_user(email=email, password=password)
        user.staff = True
        user.admin = True
        user.save(using=self._db)
        return user




class User(AbstractBaseUser):
    email = models.EmailField(verbose_name='Email Address', max_length=255, unique=True, null=False, blank=False)
    first_name = models.CharField(verbose_name='First Name', max_length=35, blank=False)
    last_name = models.CharField(verbose_name='Last Name', max_length=35, blank=False)
    is_active = models.BooleanField(default=True)
    staff = models.BooleanField(default=False)
    admin = models.BooleanField(default=False)
    date_joined = models.DateTimeField(verbose_name='Date Joined', default=timezone.now)
    last_location = models.PointField(verbose_name='Last Location', srid=4326, null=True, blank=True)

    # password field is already built-in
    # email and password are required by default

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['last_name', 'first_name']

    def get_full_name(self):
        # The user is identified by their email address
        return self.email

    def get_short_name(self):
        # The user is identified by their email address
        return self.email

    def has_perm(self, perm, obj=None):
        """ Does the user have a specific permission? """
        # Simplest possible answer: Yes, always
        return True

    def has_module_perms(self, app_label):
        """ Does the user have permissions to view the app `app_label`? """
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self):
        """ Is the user a member of staff? """
        return self.staff

    @property
    def is_admin(self):
        """ Is the user an admin member? """
        return self.admin

    def __str__(self):
        return f'{self.last_name}, {self.first_name}'


from django.utils.translation import gettext_lazy as _


class Artist(models.Model):
    artistName = models.CharField(_("Artist Name"), max_length=50)
    created = models.DateTimeField(_("Artist created date"), auto_now_add=True)
    last_updated = models.DateTimeField(_("Latest artist update"), auto_now=True)

    class Meta:
        verbose_name = _("Artist")
        verbose_name_plural = _("Artists")

    def __str__(self):
        return self.artistName


class Album(models.Model):
    artist = models.ForeignKey("Artist", verbose_name=_("Artist Album"), on_delete=models.CASCADE)
    albumName = models.CharField(_("Album Name"), max_length=50)
    created = models.DateTimeField(_("Album created date"), auto_now_add=True)
    last_updated = models.DateTimeField(_("Latest album update"), auto_now=True)

    class Meta:
        verbose_name = _("Album")
        verbose_name_plural = _("Albums")

    def __str__(self):
        return self.albumName


class Song(models.Model):
    album = models.ForeignKey("Album", verbose_name=_("Song Album"), on_delete=models.CASCADE)
    songThumbnail = models.ImageField(_("Song Thumbnail"), upload_to='thumbnail/',
                                      help_text=".jpg, .png, .jpeg, .gif, .svg supported")
    song = models.FileField(_("Song"), upload_to='songs/', help_text=".mp3 supported only", )
    songName = models.CharField(_("Song Name"), max_length=50)
    created = models.DateTimeField(_("Song created date"), auto_now_add=True)
    last_updated = models.DateTimeField(_("Latest song update"), auto_now=True)

    class Meta:
        verbose_name = _("Song")
        verbose_name_plural = _("Songs")

    def __str__(self):
        return self.songName

class Pub(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    amenity = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    addr_city = models.CharField(max_length=255, null=True)
    addr_country = models.CharField(max_length=255, null=True)
    addr_county = models.CharField(max_length=255, null=True)
    addr_housename = models.CharField(max_length=255, null=True)
    addr_housenumber = models.CharField(max_length=255, null=True)
    postcode = models.CharField(max_length=255, null=True)
    addr_street = models.CharField(max_length=255, null=True)
    phone = models.CharField(max_length=255, null=True)
    website = models.URLField(max_length=255, null=True)
    wheelchair = models.CharField(max_length=255, null=True)
    artist = models.ForeignKey(Artist, on_delete=models.SET_NULL, null=True)
    songURL = models.CharField(max_length=255, null=True)  # Add this line
    location = models.PointField()

