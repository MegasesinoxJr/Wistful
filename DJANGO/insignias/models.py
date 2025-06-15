from django.db import models
from users.models import Miembro
from PIL import Image

class Formulario(models.Model):
    creador = models.ForeignKey(Miembro, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    imagen = models.ImageField(upload_to="formularios/")
    respuestas_necesarias = models.IntegerField(help_text="Cantidad de respuestas correctas necesarias para obtener la insignia")
    nombre_insignia = models.CharField(max_length=255, default="Insignia")  # <- NUEVO CAMPO

    creado_en = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.imagen:
            img = Image.open(self.imagen.path)
            img = img.resize((150, 150))
            img.save(self.imagen.path)

    def __str__(self):
        return self.titulo


class Pregunta(models.Model):
    formulario = models.ForeignKey(Formulario, on_delete=models.CASCADE, related_name="preguntas")
    texto = models.CharField(max_length=255)

    def __str__(self):
        return self.texto


class Respuesta(models.Model):
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name="respuestas")
    texto = models.CharField(max_length=255)
    es_correcta = models.BooleanField(default=False)

    def __str__(self):
        return self.texto


class InsigniaObtenida(models.Model):
    miembro = models.ForeignKey(Miembro, on_delete=models.CASCADE, related_name="insignias")
    formulario = models.ForeignKey(Formulario, on_delete=models.CASCADE)
    obtenida_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('miembro', 'formulario')
