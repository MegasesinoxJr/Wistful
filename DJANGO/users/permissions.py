from rest_framework import permissions
from .models import Miembro
class IsVIP(permissions.BasePermission):
    """
    Solo deja crear/modificar si el usuario es VIP.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.miembro.role == 'vip'
        except:
            return False

class ModificarRoles(permissions.BasePermission):
    """
    Sólo 'admin' o 'root' pueden acceder a este endpoint.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            miembro = Miembro.objects.get(user=request.user)
        except Miembro.DoesNotExist:
            return False
        return miembro.role in ('admin', 'root',)
    
class CanCreateMeet(permissions.BasePermission):
    """
    Sólo permiten crear Meet los usuarios autenticados cuyo miembro.role
    esté en ('vip','colaborador','admin','root').
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            role = request.user.miembro.role
        except Miembro.DoesNotExist:
            return False
        return role in ('vip', 'colaborador', 'admin', 'root')
    
class Edicion(permissions.BasePermission):
    """
    Sólo permiten crear Meet los usuarios autenticados cuyo miembro.role
    esté en ('colaborador','admin','root').
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            role = request.user.miembro.role
        except Miembro.DoesNotExist:
            return False
        return role in ('colaborador', 'admin', 'root')