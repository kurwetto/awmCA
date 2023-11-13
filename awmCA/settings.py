"""
Django's settings for awmCA project.

Generated by 'django-admin startproject' using Django 4.2.7.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""
import os
import socket

from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/
SECRET_KEY = 'django-insecure-r5vz9)fvt1wl*-_xd-)^g@pv8g!4&9gww1z5)emv&@0nz_@!3g'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
    'worldapp.apps.WorldappConfig',
    'crispy_forms',
    'leaflet',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'awmCA.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates']
        ,
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'awmCA.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases


DOCKER_HOST = 'awmca_postgis'
LOCAL_HOST = 'localhost'

load_dotenv()
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'gis',
        'HOST': DOCKER_HOST if os.getenv('DOCKER_ENV') == "True" else LOCAL_HOST,
        'USER': 'docker',
        'PASSWORD': 'docker',
        'PORT': 5432 if os.getenv('DOCKER_ENV') == "True" else 25432,
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'

STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static')
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

if socket.gethostname() == "mich-bich":
    DATABASES["default"]["HOST"] = "localhost"
    DATABASES["default"]["PORT"] = 25432            # docker_config.POSTGIS_PORT
else:
    DATABASES["default"]["HOST"] = "awmca_postgis"   # f"{docker_config.PROJECT_NAME}-postgis"
    DATABASES["default"]["PORT"] = 5432

# Set DEPLOY_SECURE to True only for LIVE deployment
if os.getenv('DEPLOY_SECURE'):
    DEBUG = False
    CSRF_TRUSTED_ORIGINS = "https://michal-korneluk.shop"
    ALLOWED_HOSTS = ['.michal-korneluk.shop', 'localhost',]
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
else:
    DEBUG = True
    ALLOWED_HOSTS = []
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SECURE = False


# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CRISPY_TEMPLATE_PACK = 'bootstrap4'
CRISPY_FAIL_SILENTLY = not DEBUG

LEAFLET_CONFIG = {
    'DEFAULT_CENTER': (53.0, -8.0),
    'DEFAULT_ZOOM': 6,
    'MIN_ZOOM': 3,
    'MAX_ZOOM': 18,
    'RESET_VIEW': False,
    'SCALE': None,
    'OPACITY': 0.5,
}