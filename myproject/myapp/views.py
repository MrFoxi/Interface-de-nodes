import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from .models import JSONFile, Node, Edge
from .forms import JSONUploadForm
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from .models import Node
from .forms import NodeUpdateForm

@csrf_exempt
def update_node(request, node_id):
    if request.method == 'POST':
        node = get_object_or_404(Node, id=node_id)
        form = NodeUpdateForm(request.POST, instance=node)
        if form.is_valid():
            form.save()
            return JsonResponse({'success': True, 'node': {
                'id': node.id,
                'label': node.label,
                'concise_description': node.concise_description,
                'type': node.type
            }})
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_protect
def upload_json(request):
    if request.method == 'POST':
        form = JSONUploadForm(request.POST, request.FILES)
        if form.is_valid():
            file = request.FILES['file']
            data = json.load(file)

            # Generate a unique name for the JSON file
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            unique_name = f"{timestamp}_{file.name}"

            # Create a new JSONFile instance with the unique name
            json_file = JSONFile.objects.create(name=unique_name)

            # Create nodes
            nodes = {}
            for node_data in data['nodes']:
                node = Node.objects.create(
                    json_file=json_file,
                    label=node_data['label'],
                    concise_description=node_data['concise_description'],
                    type=node_data['type']
                )
                nodes[node.label] = node

            # Create edges
            for edge_data in data['edges']:
                Edge.objects.create(
                    json_file=json_file,
                    source=nodes[edge_data['source']],
                    target=nodes[edge_data['target']],
                    label=edge_data['label']
                )
            return render(request, 'upload_success.html', {'json_data': data})
    else:
        form = JSONUploadForm()
    return render(request, 'upload_json.html', {'form': form})

def get_graph_data(request):
    # Get the JSON file id from the request, if provided
    json_file_id = request.GET.get('json_file_id')
    
    if json_file_id:
        nodes = Node.objects.filter(json_file_id=json_file_id)
        edges = Edge.objects.filter(source__json_file_id=json_file_id)
    else:
        nodes = Node.objects.all()
        edges = Edge.objects.all()

    nodes_data = [{'id': node.id, 'json_file_id': node.json_file.id, 'label': node.label, 'concise_description': node.concise_description, 'type': node.type} for node in nodes]
    edges_data = [{'id': edge.id, 'json_file_id': edge.json_file.id, 'source': edge.source.id, 'target': edge.target.id, 'label': edge.label} for edge in edges]

    data = {
        'nodes': nodes_data,
        'edges': edges_data,
    }
    return JsonResponse(data)

def visualisation_view(request):
    json_files = JSONFile.objects.all()
    return render(request, 'visualisation.html', {'json_files': json_files})


