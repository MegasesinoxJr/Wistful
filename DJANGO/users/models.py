# models.py
from django.contrib.auth.models import User
from django.db import models
from django.utils.timezone import now
from PIL import Image


class Miembro(models.Model):
    ROLES = (
        ('miembro', 'Miembro'),
        ('vip', 'VIP'),
        ('colaborador', 'Colaborador'),
        ('admin', 'Administrador'),
        ('root', 'Root'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # Almacena la contraseña encriptada
    role = models.CharField(max_length=25, choices=ROLES, default='miembro')
    imagen_perfil = models.ImageField(upload_to='perfil/', default='perfil/default.jpg')
    fecha_registro = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.email} ({self.role})"

class Genero(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre
    
class Anime(models.Model):
    titulo = models.CharField(max_length=255)
    sinopsis = models.TextField()
    imagen = models.ImageField(upload_to='animes/')
    generos = models.ManyToManyField(Genero, related_name='animes')

    def __str__(self):
        return self.titulo
    
class Valoracion(models.Model):
    usuario = models.ForeignKey(Miembro, on_delete=models.CASCADE)
    anime = models.ForeignKey(Anime, on_delete=models.CASCADE, related_name='valoraciones')
    puntuacion = models.IntegerField()

    class Meta:
        unique_together = ('usuario', 'anime')  # un usuario solo puede puntuar una vez

    def __str__(self):
        return f"{self.usuario.user.username} - {self.anime.titulo} - {self.puntuacion}"
    
#MEETS

class Meet(models.Model):
    creador       = models.ForeignKey(Miembro, on_delete=models.CASCADE, related_name='meets_creadas')
    titulo        = models.CharField(max_length=200)
    descripcion   = models.TextField(blank=True)
    ubicacion     = models.CharField(max_length=255)   
    latitud       = models.FloatField()
    longitud      = models.FloatField()
    max_participantes = models.PositiveIntegerField()
    fecha = models.DateField(default=now)
    hora = models.TimeField(default=now)
    creado_en     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.titulo} ({self.ubicacion})"

class Asistencia(models.Model):
    meet    = models.ForeignKey(Meet, on_delete=models.CASCADE, related_name='asistentes')
    miembro = models.ForeignKey(Miembro, on_delete=models.CASCADE, related_name='meets_asistidas')
    fecha   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('meet','miembro')

    def __str__(self):
        return f"{self.meet.titulo} - {self.miembro.email}"
    


#COMBATIENTES PVP POKEMON

class Combatiente(models.Model):
    miembro       = models.OneToOneField('Miembro', on_delete=models.CASCADE, related_name='combatiente')
    imagen        = models.ImageField(upload_to='combatientes/')
    nivel         = models.PositiveIntegerField(default=1)
    salud         = models.PositiveIntegerField(default=100)
    damage         = models.PositiveIntegerField(default=10)
    habilidad_1   = models.CharField(max_length=50)
    habilidad_2   = models.CharField(max_length=50)
    habilidad_3   = models.CharField(max_length=50)
    habilidad_4   = models.CharField(max_length=50)
    trofeos       = models.PositiveIntegerField(default=0)
    experiencia   = models.PositiveIntegerField(default=0)
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # redimensionar la imagen a 100x100
        img = Image.open(self.imagen.path)
        img = img.convert('RGBA')
        img = img.resize((100, 100), Image.Resampling.LANCZOS)
        img.save(self.imagen.path)

    def subir_nivel(self):
        self.nivel += 1
        # repartir +5 puntos entre salud y daño al azar
        import random
        boost = random.randint(0,5)
        self.salud += boost
        self.damage += (5 - boost)
        self.save()
    def ganar_experiencia(self, xp):
        self.experiencia += xp
        # por cada 100 pts d expe, subimos nivel y descontamos
        while self.experiencia >= 100:
            self.experiencia -= 100
            self.subir_nivel()
        self.save()
    def __str__(self):
        return f"{self.miembro.nombre} - {self.nivel}"
    

