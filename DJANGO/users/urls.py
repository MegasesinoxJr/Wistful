
from django.urls import path
from .views import *
from django.conf.urls.static import static
from django.conf import settings
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.parsers import MultiPartParser


urlpatterns = [
    path('register/', Registro.as_view()),
    path('login/', Login.as_view()),
    path('token/refresh/', CookieTokenRefreshView.as_view()),
    path('token/logout/', LogoutView.as_view()),
    path('profile/', EditarPerfil.as_view(), name='user-profile'),
    path('usuarios/busqueda/', search_miembros),
    path('animes/', anime_list, name='anime-list'),
    path('animes/<int:pk>/', anime_detail, name='anime-detail'),
    path('generos/', genero_list, name='genero-list'),
    path('generos/<int:pk>/', genero_detail, name='genero-detail'),
    path('animes/<int:anime_id>/valorar/', valorar_anime, name='valorar-anime'),
    path("animes/<int:anime_id>/valoracion/", obtener_valoracion),
    path('top-animes/', top_animes, name='top-animes'),
    path('top-usuario/<int:id>/', top_usuario, name='top-usuario'),
    path('usuarios/<int:user_id>/', UserProfileView.as_view(), name='user-profile'),
    path('usuarios/<int:user_id>/modificar-rol/', modificar_rol),
    #STRIPE
    path('create-checkout-session/', create_checkout_session),
    path('webhook/', stripe_webhook),
    #MEETS
    path('meets/',           MeetListCreateView.as_view(), name='meets-list-create'),
    path('meets/<int:pk>/',  MeetDetailView.as_view(),       name='meets-detail'),
    path('meets/<int:pk>/asistir/', AsistirMeetView.as_view(), name='meets-asistir'),
    path('meets/<int:pk>/desapuntarse/', DesapuntarseMeetView.as_view(), name='desapuntarse'),
    path('meets/<int:pk>/delete/', MeetDestroyView.as_view(), name='meets-delete'),  
    path('meets/<int:pk>/editar/', MeetUpdateView.as_view(), name='editar_meet'),
    path('meets/mis-meets/', MeetsUsuarioView.as_view(), name='mis-meets'),

    #PVP POKEMON
    path('combatiente/', CombatienteCreateView.as_view()),
    path('top10-trofeos/', Top10CombatientesAPIView.as_view(), name='top10-trofeos'),
    #GENERAR CONTRASEÑA OLVIDADA
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),

]
#] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
