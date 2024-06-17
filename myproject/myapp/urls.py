from django.urls import path
from . import views

urlpatterns = [
    path('upload_json/', views.upload_json, name='upload_json'),
    path('get_graph_data/', views.get_graph_data, name='get_graph_data'),
    path('visualisation/', views.visualisation_view, name='visualisation'),
    path('update_node/<int:node_id>/', views.update_node, name='update_node'),
]