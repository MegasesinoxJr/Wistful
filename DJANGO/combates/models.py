# combate/models.py

from django.db import models
from users.models import Miembro
from PIL import Image

class Combatiente(models.Model):
    miembro = models.OneToOneField(Miembro, on_delete=models.CASCADE, related_name="combatiente")
    nombre = models.CharField(max_length=100)
    imagen = models.ImageField(upload_to="combatientes/")  # solo PNGs permitidos en clean()
    
    nivel = models.IntegerField(default=1)
    vida = models.IntegerField(default=100)
    daño = models.IntegerField(default=10)
    experiencia = models.IntegerField(default=0)
    copas = models.IntegerField(default=0)  # Sistema de clasificación tipo "ranked"

    habilidad_1 = models.CharField(max_length=50)
    habilidad_2 = models.CharField(max_length=50)
    habilidad_3 = models.CharField(max_length=50)
    habilidad_4 = models.CharField(max_length=50)

    creado_en = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Resize obligatorio a 300x300 y solo PNG
        if self.imagen:
            img = Image.open(self.imagen.path)
            if img.format != "PNG":
                raise ValueError("La imagen debe ser un archivo PNG")
            img = img.resize((300, 300))
            img.save(self.imagen.path)

    def __str__(self):
        return f"{self.nombre} (Lvl {self.nivel}) - {self.miembro.nombre}"
