# combate/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import Miembro
from .models import Combatiente
from .serializers import CombatienteSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vista_pvp(request):
    try:
        miembro = Miembro.objects.get(user=request.user)
    except Miembro.DoesNotExist:
        return Response({'error': 'Miembro no encontrado'}, status=404)

    try:
        combatiente = miembro.combatiente
        serializer = CombatienteSerializer(combatiente)
        return Response({
            'has_combatiente': True,
            'combatiente': serializer.data
        })
    except Combatiente.DoesNotExist:
        return Response({'has_combatiente': False})
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_combatiente(request):
    try:
        miembro = Miembro.objects.get(user=request.user)
    except Miembro.DoesNotExist:
        return Response({'error': 'Miembro no encontrado'}, status=404)

    if hasattr(miembro, 'combatiente'):
        return Response({'error': 'Ya tienes un combatiente creado'}, status=400)

    data = request.data.copy()
    data['miembro'] = miembro.id

    serializer = CombatienteSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

