"""
WSGI config for NIAT Moderator Platform
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'niat_moderator.settings')

application = get_wsgi_application()
