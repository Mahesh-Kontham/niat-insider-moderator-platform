"""
Standardized JSON Response utilities
"""

from rest_framework.response import Response
from rest_framework import status


class APIResponse:
    """Standardized API Response builder"""
    
    @staticmethod
    def success(data=None, message='Success', status_code=status.HTTP_200_OK):
        """Return a standardized success response"""
        return Response(
            {
                'success': True,
                'message': message,
                'data': data
            },
            status=status_code
        )
    
    @staticmethod
    def error(error='Error', message=None, status_code=status.HTTP_400_BAD_REQUEST, errors=None):
        """Return a standardized error response"""
        response_data = {
            'success': False,
            'error': error,
        }
        
        if message:
            response_data['message'] = message
        
        if errors:
            response_data['errors'] = errors
            
        return Response(response_data, status=status_code)
    
    @staticmethod
    def created(data=None, message='Resource created successfully'):
        """Return a standardized 201 created response"""
        return APIResponse.success(
            data=data,
            message=message,
            status_code=status.HTTP_201_CREATED
        )
    
    @staticmethod
    def no_content(message='Deleted successfully'):
        """Return a 204 no content response"""
        return Response(
            {'success': True, 'message': message},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @staticmethod
    def unauthorized(message='Authentication required'):
        """Return a 401 unauthorized response"""
        return APIResponse.error(
            error='Unauthorized',
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    @staticmethod
    def forbidden(message='Access denied'):
        """Return a 403 forbidden response"""
        return APIResponse.error(
            error='Forbidden',
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    @staticmethod
    def not_found(message='Not found'):
        """Return a 404 not found response"""
        return APIResponse.error(
            error='Not Found',
            message=message,
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    @staticmethod
    def validation_error(errors, message='Validation error'):
        """Return a 400 validation error response"""
        return APIResponse.error(
            error='Validation Error',
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            errors=errors
        )
