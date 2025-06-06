from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Formulario, InsigniaObtenida, Pregunta, Respuesta
from .serializers import FormularioSerializer, InsigniaObtenidaSerializer
from users.models import Miembro
import json

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_formularios(request):
    # Obtener el usuario logueado
    user = request.user

    # Obtener el miembro relacionado con el usuario
    miembro = Miembro.objects.get(user=user)

    # Obtener las insignias ya obtenidas por el miembro
    insignias_obtenidas = InsigniaObtenida.objects.filter(miembro=miembro)

    # Obtener todos los formularios
    formularios = Formulario.objects.all()

    # Filtrar los formularios para excluir aquellos que el miembro ya ha obtenido
    formularios_no_obtenidos = formularios.exclude(id__in=insignias_obtenidas.values('formulario__id'))

    # Serializar los formularios no obtenidos
    serializer = FormularioSerializer(formularios_no_obtenidos, many=True)
    
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def responder_formulario(request, formulario_id):
    formulario = Formulario.objects.get(pk=formulario_id)
    miembro = Miembro.objects.get(user=request.user)
    

    # 🚀 Ahora leemos del body
    respuestas_usuario = request.data.get('respuestas', [])  # viene un list[int]
    print(respuestas_usuario)
    # Convertir a ints por si vienen como strings
    respuestas_usuario = [int(r) for r in respuestas_usuario]

    respuestas_correctas = Respuesta.objects.filter(
        pregunta__formulario=formulario,
        es_correcta=True
    ).values_list('id', flat=True)

    correctas_ids = set(respuestas_correctas)
    respuestas_acertadas = len([r_id for r_id in respuestas_usuario if r_id in correctas_ids])

    if respuestas_acertadas >= formulario.respuestas_necesarias:
        insignia, created = InsigniaObtenida.objects.get_or_create(
            miembro=miembro,
            formulario=formulario
        )
        return Response({"mensaje": "¡Insignia obtenida!", "aciertos": respuestas_acertadas})

    return Response({"mensaje": "No has alcanzado los aciertos necesarios", "aciertos": respuestas_acertadas})



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insignias_perfil(request):
    miembro = Miembro.objects.get(user=request.user)
    insignias = InsigniaObtenida.objects.filter(miembro=miembro)
    serializer = InsigniaObtenidaSerializer(insignias, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_formulario(request):
    miembro = Miembro.objects.get(user=request.user)
    data = request.data

    preguntas = json.loads(data.get('preguntas'))

    formulario = Formulario.objects.create(
        creador=miembro,
        nombre_insignia=data.get('nombre'),  
        titulo=data.get('titulo'),
        descripcion=data.get('descripcion'),
        imagen=data.get('imagen'),
        respuestas_necesarias=int(data.get('respuestas_necesarias'))
    )

    for p in preguntas:
        pregunta = Pregunta.objects.create(formulario=formulario, texto=p['texto'])
        for r in p['respuestas']:
            Respuesta.objects.create(
                pregunta=pregunta,
                texto=r['texto'],
                es_correcta=r['es_correcta']
            )

    return Response({'mensaje': 'Formulario creado'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_formulario(request, formulario_id):
    try:
        formulario = Formulario.objects.get(pk=formulario_id)
        serializer = FormularioSerializer(formulario)
        return Response(serializer.data)
    except Formulario.DoesNotExist:
        return Response({'error': 'Formulario no encontrado'}, status=404)
