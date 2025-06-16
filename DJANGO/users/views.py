import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.http import HttpResponse,JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import *
from .serializers import *
from .permissions import *
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import traceback
import stripe
from urllib.parse import urlencode
from rest_framework.pagination import PageNumberPagination
from django.db.models import Avg, F, Window
from django.db.models.functions import RowNumber
import requests
from rest_framework.generics import DestroyAPIView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from decouple import config
from rest_framework.generics import ListAPIView
from django.db.models import Q
from rest_framework import generics
User = get_user_model()


class Registro(APIView):
    def post(self, request):
        serializer = RegisterMiembroSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Registro exitoso'}, status=201)
        return Response(serializer.errors, status=400)

class Login(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            return Response({'error': 'Credenciales inválidas'}, status=401)

        try:
            miembro = Miembro.objects.get(user=user)
        except Miembro.DoesNotExist:
            return Response({'error': 'No existe el perfil de Miembro'}, status=404)

        refresh = RefreshToken.for_user(user)

        response = Response({
            'access': str(refresh.access_token),
            'user': {
                'id': miembro.id,
                'nombre': miembro.nombre,
                'email': miembro.email,
                'role': miembro.role,
                'imagen_perfil': miembro.imagen_perfil.url if miembro.imagen_perfil else None
            }
        })

        response.set_cookie(
        key='refresh_token',
        value=str(refresh),
        httponly=True,
        samesite='Lax',
        secure= False
        )

        return response

class EditarPerfil(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        miembro = Miembro.objects.get(user=request.user)
        serializer = MiembroSerializer(miembro)
        return Response(serializer.data)

    def put(self, request):
        miembro = Miembro.objects.get(user=request.user)
        serializer = MiembroSerializer(miembro, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Perfil actualizado correctamente."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_miembros(request):
    """
    GET /api/users/search/?q=<texto>
    Devuelve hasta 20 usuarios cuyo nombre contiene <texto>.
    """
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response([], status=200)
    resultados = Miembro.objects.filter(nombre__icontains=q)[:20]
    serializer = MiembroSerializer(resultados, many=True)
    return Response(serializer.data)


def validate_refresh_token(refresh_token):
    try:
        
        token = RefreshToken(refresh_token)
        print("CORRECTO")
        print(f"Token Payload: {token.payload}")
        print(f"Token Payload: {token.payload}")
        return token
    except Exception as e:
        print(f"Error al validar token: {str(e)}")
        raise AuthenticationFailed('Invalid or expired refresh token')
    
class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token_str = request.COOKIES.get('refresh_token')
        print("TOKEN (string):", refresh_token_str)

        if not refresh_token_str:
            return Response({'detail': 'Refresh token not provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token_obj = RefreshToken(refresh_token_str)
            print("CORRECTO, payload:", token_obj.payload)
        except Exception as e:
            print("Error al validar token:", e)
            return Response({'detail': 'Invalid or expired refresh token'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={'refresh': refresh_token_str})
        print("Serializer construido:", serializer)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as exc:
            print("serializer.is_valid() falló:", exc)
            return Response({'detail': 'Invalid or expired refresh token'}, status=status.HTTP_400_BAD_REQUEST)

        print("Refresh token es válido, generando nuevo access token.")
        return Response(serializer.validated_data)
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # refresh token de las cookies
            refresh_token = request.COOKIES.get('refresh_token')

            if not refresh_token:
                return Response({"detail": "No refresh token found"}, status=400)

            token = RefreshToken(refresh_token)
            token.blacklist()

            response = Response({"detail": "Logged out successfully"})
            response.delete_cookie('refresh_token')
            return response

        except Exception as e:
            return Response({"detail": str(e)}, status=400)

    
class AnimePagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'  
    max_page_size = 6                 
ROLES_PERMITIDOS_POST = ['admin', 'colaborador', 'root']

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([AllowAny])
def anime_list(request):
    """
    GET  /api/animes/?titulo=<busqueda>&page=<n>&generos=<id>   -> Listado paginado y filtrado con ranking global
    POST /api/animes/                                           -> Crear un nuevo anime (solo admin, colaborador, root)
    """
    if request.method == 'GET':
        # Ranking global
        ranking_qs = Anime.objects.annotate(puntuacion_promedio=Avg('valoraciones__puntuacion')) \
                                  .order_by('-puntuacion_promedio')

        ranking_dict = {
            anime.id: i + 1  # ranking basado en orden
            for i, anime in enumerate(ranking_qs)
        }

        # Queryset filtrado
        qs = ranking_qs

        titulo = request.query_params.get('titulo')
        if titulo:
            qs = qs.filter(titulo__icontains=titulo)

        generos = request.query_params.getlist('generos')
        if generos:
            qs = qs.filter(generos__id__in=generos).distinct()

        paginator = AnimePagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AnimeSerializer(page, many=True)

        data = serializer.data
        for i, anime_data in enumerate(data):
            anime_id = page[i].id
            anime_data['posicion'] = ranking_dict.get(anime_id)

        return paginator.get_paginated_response(data)

    # post
    try:
        miembro = request.user.miembro
    except Miembro.DoesNotExist:
        return Response({'detail': 'El miembro no existe.'}, status=status.HTTP_404_NOT_FOUND)

    if miembro.role not in ROLES_PERMITIDOS_POST:
        return Response({'detail': 'No tienes permiso para realizar esta acción.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = AnimeSerializer(data=request.data)
    if serializer.is_valid():
        generos_ids = json.loads(request.data.get('generos'))
        generos = Genero.objects.filter(id__in=generos_ids)

        anime = serializer.save()
        anime.generos.set(generos)
        anime.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def anime_detail(request, pk):
    """
    GET    /api/animes/<pk>/   -> Obtener datos de un anime
    PUT    /api/animes/<pk>/   -> Reemplazar un anime completo
    PATCH  /api/animes/<pk>/   -> Actualizar parcialmente un anime
    DELETE /api/animes/<pk>/   -> Eliminar un anime
    """
    try:
        anime = Anime.objects.get(pk=pk)
    except Anime.DoesNotExist:
        return Response({'error': 'Anime no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = AnimeSerializer(anime)
        return Response(serializer.data)

    # Validación de permisos para modificaciones
    try:
        miembro = request.user.miembro
    except AttributeError:
        return Response({'detail': 'El miembro no existe.'}, status=status.HTTP_404_NOT_FOUND)

    if miembro.role not in ROLES_PERMITIDOS_POST:
        return Response({'detail': 'No tienes permiso para modificar este anime.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method in ('PUT', 'PATCH'):
        # PUT = full update, PATCH = partial update
        partial = (request.method == 'PATCH')
        serializer = AnimeSerializer(anime, data=request.data, partial=partial)
        if serializer.is_valid():
            anime = serializer.save()
            # Procesar géneros enviados como lista de IDs en JSON
            generos_ids = request.data.getlist('generos')
            if generos_ids:
                generos = Genero.objects.filter(id__in=generos_ids)
                anime.generos.set(generos)
            return Response(AnimeSerializer(anime).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    anime.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)





@api_view(['GET', 'POST'])
def genero_list(request):

    if request.method == 'GET':
        generos = Genero.objects.all()
        serializer = GeneroSerializer(generos, many=True)
        return Response(serializer.data)

    # POST
    serializer = GeneroSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def genero_detail(request, pk):

    try:
        genero = Genero.objects.get(pk=pk)
    except Genero.DoesNotExist:
        return Response({'error': 'Género no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = GeneroSerializer(genero)
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = GeneroSerializer(genero, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    genero.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def valorar_anime(request, anime_id):
    try:
        miembro = Miembro.objects.get(user=request.user.id)
    except Miembro.DoesNotExist:
        return Response({'error': 'Perfil de miembro no encontrado'}, status=404)

    try:
        anime = Anime.objects.get(pk=anime_id)
    except Anime.DoesNotExist:
        return Response({'error': 'Anime no encontrado'}, status=404)

    puntuacion = request.data.get('puntuacion')

    if not puntuacion or not (1 <= int(puntuacion) <= 10):
        return Response({'error': 'Puntuación inválida. Debe estar entre 1 y 10.'}, status=400)

    valoracion, created = Valoracion.objects.update_or_create(
        usuario=miembro,
        anime=anime,
        defaults={'puntuacion': puntuacion}
    )

    serializer = ValoracionSerializer(valoracion)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_valoracion(request, anime_id):
    try:
        miembro = Miembro.objects.get(user=request.user.id)
    except Miembro.DoesNotExist:
        return Response({'error': 'Perfil de miembro no encontrado'}, status=404)

    try:
        anime = Anime.objects.get(pk=anime_id)
    except Anime.DoesNotExist:
        return Response({'error': 'Anime no encontrado'}, status=404)

    try:
        valoracion = Valoracion.objects.get(usuario=miembro, anime=anime)
        serializer = ValoracionSerializer(valoracion)
        return Response(serializer.data)
    except Valoracion.DoesNotExist:
        return Response({'detail': 'Aún no has valorado este anime.'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def top_animes(request):
    """
    Listado global con posición fija, paginado y con filtro opcional.
    """
    # Base: queryset anotado con puntuación promedio
    base_qs = Anime.objects.annotate(
        avg_score=Avg('valoraciones__puntuacion')
    ).order_by(F('avg_score').desc(nulls_last=True))

    # Subquery para mapear ID -> posición global
    ranked_qs = base_qs.annotate(
        row_number=Window(
            expression=RowNumber(),
            order_by=[F('avg_score').desc(nulls_last=True)]
        )
    ).values('id', 'row_number')

    # diccionario con posiciones
    posiciones = {entry['id']: entry['row_number'] for entry in ranked_qs}

    # aplicar filtro si hay
    titulo = request.query_params.get('titulo')
    if titulo:
        base_qs = base_qs.filter(titulo__icontains=titulo)

    # Anyadir campo de posicion desde el diccionario
    for anime in base_qs:
        anime.posicion = posiciones.get(anime.id)

    # paginator
    paginator = AnimePagination()
    page = paginator.paginate_queryset(base_qs, request)
    serializer = AnimeTopSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
def top_usuario(request, id):
    valoraciones = Valoracion.objects.filter(usuario_id=id).values('anime').annotate(promedio=Avg('puntuacion')).order_by('-promedio')
    animes_ids = [v['anime'] for v in valoraciones]
    animes = Anime.objects.filter(id__in=animes_ids)

   
    promedios = {v['anime']: v['promedio'] for v in valoraciones}

    
    data = []
    for anime in animes:
        serialized = AnimeSerializer(anime).data
        serialized['puntuacion_promedio'] = round(promedios[anime.id], 2)
        data.append(serialized)

    # ordenar segun puntuacion promedio
    data.sort(key=lambda a: a['puntuacion_promedio'], reverse=True)

    return Response(data)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            miembro = Miembro.objects.get(id=user_id)
        except Miembro.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=404)


        serializer = MiembroSerializer(miembro)
        return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, ModificarRoles])
def modificar_rol(request, user_id):
    """
    PUT /api/usuarios/<user_id>/modify-role/
    Body: { "role": "<nuevo_rol>" }
    """
    try:
        target = Miembro.objects.get(pk=user_id)
    except Miembro.DoesNotExist:
        return Response({"error": "Usuario no existe"}, status=404)

    nuevo_rol = request.data.get('role')
    actor_miembro = Miembro.objects.get(user=request.user)
    actor_rol = actor_miembro.role

    # Evitar que admin modifique a admin o root
    if actor_rol == 'admin' and target.role in ('admin', 'root'):
        return Response(
            {"error": "No tienes permisos para modificar a este usuario."},
            status=403
        )

    # Definir roles permitidos según el actor
    if actor_rol == 'admin':
        permitido = ('colaborador', 'vip', 'miembro')
    elif actor_rol == 'root':
        permitido = ('admin', 'colaborador', 'vip', 'miembro')
    else:
        return Response(
            {"error": "No tienes permisos para modificar roles."},
            status=403
        )

    if nuevo_rol not in permitido:
        return Response(
            {"error": f"No puedes asignar el rol '{nuevo_rol}' como {actor_rol}."},
            status=403
        )

    target.role = nuevo_rol
    target.save()
    return Response(MiembroSerializer(target).data) 

#PASARELA DE PAGO
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """
    Crea una sesión de Stripe Checkout, usando el miembro
    autenticado (vía JWT) y pasando su miembro.id en metadata.
    """
    try:
        miembro = Miembro.objects.get(user=request.user)
    except Miembro.DoesNotExist:
        return Response({'error': 'Perfil de Miembro no encontrado.'}, status=404)

    PRICE_ID = "price_1RGVHlEAe4ToeXLuuQzk6bxA"  # tu Price ID de Stripe
    data = {
        'payment_method_types[]':               'card',
        'line_items[0][price]':                 PRICE_ID,
        'line_items[0][quantity]':              '1',
        'mode':                                 'payment',
        'success_url': f'{settings.FRONTEND_IP}/success',
        'cancel_url': f'{settings.FRONTEND_IP}/cancel',
        'metadata[miembro_id]':                 str(miembro.id),
    }

    try:
        body = urlencode(data, doseq=True)
        resp = requests.post(
            'https://api.stripe.com/v1/checkout/sessions',
            data=body,
            auth=(settings.STRIPE_SECRET_KEY, ""),
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        resp.raise_for_status()
        session = resp.json()
        return Response({'id': session['id']})
    except requests.exceptions.HTTPError:
        err = resp.json().get('error', resp.text)
        return Response({'error': err}, status=resp.status_code)
    except Exception:
        traceback.print_exc()
        return Response({'error': 'Error interno al crear la sesión de pago.'}, status=500)


@api_view(['POST'])
@permission_classes([]) 
@csrf_exempt
def stripe_webhook(request):
    """
    Webhook público de Stripe: no usamos autenticación JWT aquí,
    solo verificamos la firma y actualizamos el role del Miembro.
    """
    payload    = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session   = event['data']['object']
        member_id = session['metadata'].get('miembro_id')
        if member_id:
            try:
                miembro = Miembro.objects.get(pk=member_id)
                miembro.role = 'vip'
                miembro.save()
            except Miembro.DoesNotExist:
                pass

    return HttpResponse(status=200)

#MEETS

class MeetPagination(PageNumberPagination):
    page_size = 4

class MeetListCreateView(generics.ListCreateAPIView):
    queryset = Meet.objects.all().order_by('-creado_en')
    serializer_class = MeetSerializer
    pagination_class = MeetPagination

    def get_permissions(self):
        if self.request.method == "POST":
            # vip, + usuarios administradores pueden crear meet
            return [IsAuthenticated(), CanCreateMeet()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user.miembro)

class MeetDetailView(generics.RetrieveAPIView):
    queryset         = Meet.objects.all()
    serializer_class = MeetSerializer

class AsistirMeetView(generics.CreateAPIView):
    serializer_class   = AsistenciaSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        meet = Meet.objects.get(pk=kwargs['pk'])
        miembro = request.user.miembro
        if meet.asistentes.count() >= meet.max_participantes:
            return Response({'error': 'Meet completo'}, status=status.HTTP_400_BAD_REQUEST)
        asistencia, created = Asistencia.objects.get_or_create(meet=meet, miembro=miembro)
        return Response(AsistenciaSerializer(asistencia).data, status=status.HTTP_201_CREATED)
    
class DesapuntarseMeetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            meet = Meet.objects.get(pk=pk)
            asistencia = Asistencia.objects.get(meet=meet, miembro=request.user.miembro)
            asistencia.delete()  # Elimina la asistencia
            return Response({"detail": "Te has desapuntado exitosamente"}, status=status.HTTP_200_OK)
        except Asistencia.DoesNotExist:
            return Response({"detail": "No estás apuntado a esta meet"}, status=status.HTTP_400_BAD_REQUEST)
        except Meet.DoesNotExist:
            return Response({"detail": "La meet no existe"}, status=status.HTTP_404_NOT_FOUND)
        
class MeetDestroyView(DestroyAPIView):
    queryset = Meet.objects.all()
    serializer_class = MeetSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        meet = self.get_object()
        user_miembro = request.user.miembro
        user_rol = getattr(user_miembro, "role", None)  # o request.user.rol si tu modelo lo tiene allí
        
        # Comprobamos permisos
        if user_miembro != meet.creador and user_rol not in ["admin", "root"]:
            return Response({"detail": "No tienes permiso para eliminar esta meet."}, status=403)

        return super().delete(request, *args, **kwargs)

class MeetUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Meet.objects.all()
    serializer_class = MeetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, *args, **kwargs):
        meet = self.get_object()
        user = request.user.miembro
        if user != meet.creador and getattr(user, 'role', '') not in ['admin', 'root']:
            return Response({"detail": "No tienes permiso para editar esta meet."}, status=403)
        return super().put(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        return self.put(request, *args, **kwargs)
    
class MeetsUsuarioView(generics.ListAPIView):
    serializer_class = MeetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        miembro = self.request.user.miembro
        return Meet.objects.filter(
            Q(asistentes__miembro=miembro) | Q(creador=miembro)
        ).distinct().order_by('-creado_en')

# PVP POKEMONS

class CombatienteCreateView(generics.GenericAPIView):
    serializer_class = CombatienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        try:
            return Combatiente.objects.get(miembro__user=self.request.user)
        except Combatiente.DoesNotExist:
            raise NotFound("No tienes un combatiente creado.")

    def get(self, request, *args, **kwargs):
        """
        GET /combatiente/
        Si existe, devuelve el combatiente del usuario.
        Si no existe, devuelve 404 con mensaje.
        """
        try:
            combatiente = self.get_object()
            serializer = self.get_serializer(combatiente)
            return Response(serializer.data)
        except NotFound as e:
            return JsonResponse({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, *args, **kwargs):
        """
        POST /combatiente/
        Crea un nuevo combatiente para el usuario autenticado,
        siempre y cuando no tenga ya uno.
        """
        miembro = Miembro.objects.get(user=request.user)
        if Combatiente.objects.filter(miembro=miembro).exists():
            raise ValidationError({"detail": "Ya tienes un combatiente creado."})

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(miembro=miembro)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, *args, **kwargs):
        """
        PATCH /combatiente/
        Actualiza parcialmente el combatiente del usuario autenticado.
        """
        combatiente = self.get_object()
        serializer = self.get_serializer(combatiente, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class Top10CombatientesAPIView(ListAPIView):
    serializer_class = TopCombatienteSerializer

    def get_queryset(self):
        return Combatiente.objects.select_related('miembro') \
            .order_by('-trofeos')[:10]



# GENERAR CONTRASEÑA OLVIDADA:

class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_IP}/ResetearPassword/{uid}/{token}/"

            text_message = f"Restablecer tu contraseña: {reset_link}"
            html_message = f"""
                <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                <p><a href="{reset_link}">Wistful - Restablecer Contraseña</a></p>
            """

            email_msg = EmailMultiAlternatives(
                subject="Recuperar contraseña",
                body=text_message,  
                from_email="wistfulsmtp@gmail.com",
                to=[email],
            )
            email_msg.attach_alternative(html_message, "text/html") 
            email_msg.send(fail_silently=False)

            return Response({"message": "Correo enviado"}, status=200)

        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=404)         
class ResetPasswordView(APIView):
    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Enlace inválido"}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "Token inválido o expirado"}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Contraseña restablecida correctamente"}, status=200)