from django.db import models

class JSONFile(models.Model):
    name = models.CharField(max_length=100)
    window = models.IntegerField(max_length=1000, default=1)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ImageNode(models.Model):
    name = models.CharField(max_length=50, default='Cerveau')

    def __str__(self):
        return self.name

class Node(models.Model):
    json_file = models.ForeignKey(JSONFile, related_name='nodes', on_delete=models.CASCADE)
    label = models.CharField(max_length=200)
    concise_description = models.TextField()
    type = models.CharField(max_length=50)
    image_node = models.ForeignKey(ImageNode, null=True, blank=True, on_delete=models.DO_NOTHING, related_name='nodes', default=1)

    def __str__(self):
        return self.label

class Edge(models.Model):
    json_file = models.ForeignKey(JSONFile, related_name='edges', on_delete=models.CASCADE)
    source = models.ForeignKey(Node, related_name='source_edges', on_delete=models.CASCADE)
    target = models.ForeignKey(Node, related_name='target_edges', on_delete=models.CASCADE)
    label = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.source} {self.label} {self.target}"
