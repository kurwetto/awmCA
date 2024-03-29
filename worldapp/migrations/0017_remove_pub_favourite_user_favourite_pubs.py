# Generated by Django 5.0.2 on 2024-03-29 16:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('worldapp', '0016_pub_favourite'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pub',
            name='favourite',
        ),
        migrations.AddField(
            model_name='user',
            name='favourite_pubs',
            field=models.ManyToManyField(blank=True, related_name='favourited_by', to='worldapp.pub'),
        ),
    ]
