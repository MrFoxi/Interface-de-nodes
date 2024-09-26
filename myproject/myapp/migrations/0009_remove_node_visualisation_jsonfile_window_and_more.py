# Generated by Django 5.0.6 on 2024-09-26 07:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0008_visualisation_node_visualisation'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='node',
            name='visualisation',
        ),
        migrations.AddField(
            model_name='jsonfile',
            name='window',
            field=models.IntegerField(default=1, max_length=1000),
        ),
        migrations.DeleteModel(
            name='Visualisation',
        ),
    ]
