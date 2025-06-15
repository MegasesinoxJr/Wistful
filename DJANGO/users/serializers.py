from rest_framework import serializers
from django.contrib.auth.models import User
from insignias.serializers import InsigniaObtenidaSerializer
from .models import *
from django.db.models import Avg
from datetime import datetime, timedelta
class RegisterMiembroSerializer(serializers.Serializer):
    nombre = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_nombre(self, value):
        if Miembro.objects.filter(nombre=value).exists():
            raise serializers.ValidationError("Este nombre ya está en uso.")
        return value

    def validate_email(self, value):
        if Miembro.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está en uso.")
        return value

    def create(self, validated_data):
        email = validated_data['email']
        nombre = validated_data['nombre']
        password = validated_data['password']


        user = User.objects.create_user(username=email, email=email, password=password)

        miembro = Miembro.objects.create(
            user=user,
            nombre=nombre,
            email=email,
            password='',  
        )

        return miembro
    
class MiembroSerializer(serializers.ModelSerializer):
    insignias = InsigniaObtenidaSerializer(many=True, read_only=True)
    class Meta:
        model = Miembro
        fields = ['nombre', 'email', 'role', 'imagen_perfil','id', 'insignias']

class GeneroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genero
        fields = ['id', 'nombre']

class AnimeSerializer(serializers.ModelSerializer):
    puntuacion_promedio = serializers.SerializerMethodField()
    generos = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='nombre'
    )
    generos_ids = serializers.PrimaryKeyRelatedField(
        source='generos',
        many=True,
        read_only=True
    )

    class Meta:
        model = Anime
        fields = ['id', 'titulo', 'sinopsis', 'imagen', 'generos', 'generos_ids', 'puntuacion_promedio']

    def get_puntuacion_promedio(self, obj):
        valoraciones = obj.valoraciones.all()
        if not valoraciones.exists():
            return 0
        return round(sum(v.puntuacion for v in valoraciones) / valoraciones.count(), 2)

class ValoracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Valoracion
        fields = ['id', 'usuario', 'anime', 'puntuacion']
        read_only_fields = ['usuario']

class AnimeTopSerializer(serializers.ModelSerializer):
    puntuacion_promedio = serializers.SerializerMethodField()
    posicion = serializers.SerializerMethodField()

    class Meta:
        model = Anime
        fields = ['id', 'posicion', 'titulo', 'imagen', 'sinopsis', 'puntuacion_promedio']

    def get_puntuacion_promedio(self, obj):
        avg = getattr(obj, 'avg_score', None)
        if avg is not None:
            return round(avg, 2)
        result = obj.valoraciones.aggregate(avg=Avg('puntuacion'))['avg']
        return round(result or 0, 2)

    def get_posicion(self, obj):
        return getattr(obj, 'posicion', None)

#MEETS

class AsistenciaSerializer(serializers.ModelSerializer):
    miembro = MiembroSerializer(read_only=True)
    class Meta:
        model = Asistencia
        fields = ['miembro', 'fecha']

class MeetSerializer(serializers.ModelSerializer):
    asistentes = AsistenciaSerializer(many=True, read_only=True)
    creador    = MiembroSerializer(read_only=True)
    class Meta:
        model = Meet
        fields = '__all__'  

    def get_inscritos(self, obj):
        return obj.asistentes.count()
    
    def validate(self, data):
        fecha = data.get("fecha", getattr(self.instance, "fecha", None))
        hora = data.get("hora", getattr(self.instance, "hora", None))

        if fecha and hora:
            try:
                fecha_hora = datetime.fromisoformat(f"{fecha}T{hora}")
            except ValueError:
                raise serializers.ValidationError("Formato inválido de fecha u hora.")

            if fecha_hora < datetime.now() + timedelta(hours=24):
                raise serializers.ValidationError("La fecha y hora deben estar al menos 24 horas en el futuro.")

        return data
    
#PVP POKEMON

class CombatienteSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source='miembro.nombre', read_only=True)
    class Meta:
        model = Combatiente
      
        fields = [
            'id', 'imagen',
            'habilidad_1','habilidad_2','habilidad_3','habilidad_4',
            'nivel','salud','damage','trofeos','experiencia','nombre'
        ]
        read_only_fields = ['id','nivel','salud','damage','trofeos']
    
class TopCombatienteSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source='miembro.nombre')
    imagen = serializers.ImageField()

    class Meta:
        model = Combatiente
        fields = ('id', 'nombre', 'imagen', 'trofeos')