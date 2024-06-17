from django import forms
from .models import Node

class JSONUploadForm(forms.Form):
    file = forms.FileField()

class NodeUpdateForm(forms.ModelForm):
    class Meta:
        model = Node
        fields = ['label', 'concise_description', 'type']