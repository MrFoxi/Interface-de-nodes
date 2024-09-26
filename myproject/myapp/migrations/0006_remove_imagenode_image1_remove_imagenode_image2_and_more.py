# Generated by Django 5.0.6 on 2024-06-19 08:13

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0005_imagenode'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='imagenode',
            name='image1',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='image2',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='image3',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='image4',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='image5',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='image6',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='image7',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='image8',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='image9',
        ),
        migrations.RemoveField(
            model_name='imagenode',
            name='node',
        ),
        migrations.AddField(
            model_name='imagenode',
            name='name',
            field=models.CharField(default='default_image_name', max_length=50),
        ),
        migrations.AddField(
            model_name='node',
            name='image_node',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='nodes', to='myapp.imagenode'),
        ),
    ]