# Generated by Django 5.0.2 on 2024-04-08 16:35

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('worldapp', '0032_pub_date'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pub',
            name='date',
        ),
    ]
