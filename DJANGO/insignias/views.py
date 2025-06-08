from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Formulario, InsigniaObtenida, Pregunta, Respuesta
from .serializers import FormularioSerializer, InsigniaObtenidaSerializer
from users.models import Miembro
from users.permissions import Edicion
import json
from rest_framework import status

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_formularios(request):
    user = request.user
    miembro = Miembro.objects.get(user=user)

    # Si el rol es colaborador, admin o root, devolver todos los formularios
    if miembro.role in ['colaborador', 'admin', 'root']:
        formularios = Formulario.objects.all()
    else:
        # Si es miembro o vip, excluir los ya obtenidos
        insignias_obtenidas = InsigniaObtenida.objects.filter(miembro=miembro)
        formularios = Formulario.objects.exclude(id__in=insignias_obtenidas.values('formulario__id'))

    serializer = FormularioSerializer(formularios, many=True)
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
@permission_classes([IsAuthenticated,Edicion])
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
    
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated, Edicion])
def editar_formulario(request, formulario_id):
    try:
        formulario = Formulario.objects.get(pk=formulario_id)
    except Formulario.DoesNotExist:
        return Response({'error': 'Formulario no encontrado'}, status=404)

    try:
        miembro = Miembro.objects.get(user=request.user)
    except Miembro.DoesNotExist:
        return Response({'error': 'Miembro no encontrado'}, status=404)

    # Permitir si es el creador o tiene rol elevado
    if formulario.creador.user != request.user and miembro.role not in ('admin', 'root', 'colaborador'):
        return Response({'error': 'No autorizado'}, status=403)

    data = request.data

    try:
        preguntas = json.loads(data.get('preguntas', '[]'))
    except json.JSONDecodeError:
        return Response({'error': 'Formato inválido de preguntas'}, status=400)

    formulario.titulo = data.get('titulo')
    formulario.descripcion = data.get('descripcion')
    formulario.nombre_insignia = data.get('nombre')
    formulario.respuestas_necesarias = data.get('respuestas_necesarias')

    if data.get('imagen'):
        formulario.imagen = data.get('imagen')

    formulario.save()

    # Eliminar preguntas y respuestas anteriores
    formulario.preguntas.all().delete()

    # Crear nuevas preguntas y respuestas
    for p in preguntas:
        pregunta = Pregunta.objects.create(formulario=formulario, texto=p['texto'])
        for r in p['respuestas']:
            Respuesta.objects.create(
                pregunta=pregunta,
                texto=r['texto'],
                es_correcta=r['es_correcta']
            )

    return Response({'mensaje': 'Formulario actualizado'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, Edicion])
def eliminar_formulario(request, formulario_id):
    try:
        formulario = Formulario.objects.get(pk=formulario_id)
    except Formulario.DoesNotExist:
        return Response({'error': 'Formulario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    miembro = Miembro.objects.get(user=request.user)

    # Solo el creador o alguien con rol elevado puede eliminar
    if formulario.creador.user != request.user and miembro.role not in ('admin', 'root', 'colaborador'):
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    formulario.delete()
    return Response({'mensaje': 'Formulario eliminado'}, status=status.HTTP_204_NO_CONTENT)