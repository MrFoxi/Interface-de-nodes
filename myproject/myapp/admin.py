from django.contrib import admin
from .models import JSONFile ,Node, Edge, ImageNode

# Register your models here.

admin.site.register(JSONFile)
admin.site.register(Node)
admin.site.register(Edge)
admin.site.register(ImageNode)