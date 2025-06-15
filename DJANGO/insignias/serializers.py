from rest_framework import serializers
from .models import Formulario, Pregunta, Respuesta, InsigniaObtenida

class RespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respuesta
        fields = ['id', 'texto', 'es_correcta']

class PreguntaSerializer(serializers.ModelSerializer):
    respuestas = RespuestaSerializer(many=True)

    class Meta:
        model = Pregunta
        fields = ['id', 'texto', 'respuestas']

class FormularioSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True, read_only=True)

    class Meta:
        model = Formulario
        fields = ['id', 'titulo', 'descripcion', 'imagen', 'respuestas_necesarias', 'nombre_insignia', 'preguntas']

class InsigniaObtenidaSerializer(serializers.ModelSerializer):
    formulario = FormularioSerializer()

    class Meta:
        model = InsigniaObtenida
        fields = ['formulario', 'obtenida_en']
