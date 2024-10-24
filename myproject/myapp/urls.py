from django.urls import path
from . import views

urlpatterns = [
    path('menu/', views.get_menu, name='menu'),
    path('upload_json/', views.upload_json, name='upload_json'),
    path('get_graph_data/', views.get_graph_data, name='get_graph_data'),
    path('visualisation/', views.visualisation_view, name='visualisation'),
    path('update_node/<int:node_id>/', views.update_node, name='update_node'),
    path('data_window/', views.get_files_by_window, name='get_files_by_window'),
    path('graph_data_by_window/', views.get_graph_data_by_window, name='get_graph_data_by_window'),
    path('get_windows/', views.get_windows, name='get_windows'),
]