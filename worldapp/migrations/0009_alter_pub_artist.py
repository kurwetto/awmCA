# Generated by Django 5.0.2 on 2024-03-28 16:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('worldapp', '0008_remove_pub_artist_pub_artist'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pub',
            name='artist',
            field=models.CharField(max_length=255, null=True),
        ),
    ]
