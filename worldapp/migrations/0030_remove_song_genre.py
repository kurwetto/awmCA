# Generated by Django 5.0.2 on 2024-04-03 17:57

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('worldapp', '0029_genre'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='song',
            name='genre',
        ),
    ]
