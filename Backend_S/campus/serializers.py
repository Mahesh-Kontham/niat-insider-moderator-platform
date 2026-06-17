"""
Serializers for Campus App
"""

from rest_framework import serializers
from core.models import Campus


class CampusSerializer(serializers.ModelSerializer):
    """Campus Serializer"""
    
    class Meta:
        model = Campus
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']
