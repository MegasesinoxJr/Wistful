from django.urls import path
from .views import *

urlpatterns = [
    path('formularios/', listar_formularios),
    path('formularios/<int:formulario_id>/', obtener_formulario),
    path('formularios/<int:formulario_id>/responder/', responder_formulario, name='responder_formulario'),
    path('perfil/insignias/', insignias_perfil),
    path('formularios/create/', crear_formulario),
    path('formularios/<int:formulario_id>/editar/', editar_formulario),
    path('formularios/<int:formulario_id>/delete/', eliminar_formulario, name='eliminar_formulario'),

]