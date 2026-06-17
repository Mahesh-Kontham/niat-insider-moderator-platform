"""
Views for Campus App
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from core.models import Campus
from core.serializers import CampusSerializer
from moderator.serializers import CampusArticleSerializer
from utils.responses import APIResponse


class CampusViewSet(viewsets.ReadOnlyModelViewSet):
    """Campus ViewSet"""
    
    queryset = Campus.objects.all()
    serializer_class = CampusSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/campus/
        
        List all campuses without pagination, wrapped in standard success response
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(data=serializer.data)
    
    @action(detail=False, methods=['get'])
    def with_articles(self, request):
        """
        GET /api/campus/with_articles/
        
        List campuses with article count
        """
        campuses = self.get_queryset()
        serializer = CampusArticleSerializer(campuses, many=True)
        
        return APIResponse.success(data=serializer.data)
