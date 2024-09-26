from django import forms
from .models import Node, ImageNode

class JSONUploadForm(forms.Form):
    file = forms.FileField()
    window = forms.IntegerField()



class NodeUpdateForm(forms.ModelForm):
    class Meta:
        model = Node
        fields = ['label', 'concise_description', 'type', 'image_node']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['image_node'].queryset = ImageNode.objects.all()  # Charger toutes les instances d'ImageNode

    def clean(self):
        cleaned_data = super().clean()
        image_node = cleaned_data.get('image_node')

        # Validez image_node ici si nécessaire
        return cleaned_data