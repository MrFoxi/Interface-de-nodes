# Generated by Django 5.0.6 on 2024-07-08 07:29

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0007_alter_imagenode_name_alter_node_image_node'),
    ]

    operations = [
        migrations.CreateModel(
            name='Visualisation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.AddField(
            model_name='node',
            name='visualisation',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='nodes', to='myapp.visualisation'),
        ),
    ]
