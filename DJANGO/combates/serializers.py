# combate/serializers.py

from rest_framework import serializers
from .models import Combatiente

class CombatienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Combatiente
        fields = '__all__'
        read_only_fields = ['nivel', 'vida', 'daño', 'experiencia', 'copas']
