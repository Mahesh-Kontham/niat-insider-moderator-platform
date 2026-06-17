"""
Management command to create admin and seed data
"""

from django.core.management.base import BaseCommand
from django.db import IntegrityError
from core.models import CustomUser, Campus
from utils.constants import UserRole


class Command(BaseCommand):
    help = 'Seed admin user and sample campuses'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@test.com',
            help='Admin email'
        )
        parser.add_argument(
            '--admin-password',
            type=str,
            default='Admin@123456',
            help='Admin password'
        )
    
    def handle(self, *args, **options):
        admin_email = options['admin_email']
        admin_password = options['admin_password']
        
        # Create sample campuses
        campuses_data = [
            'Chennai',
            'Bangalore',
            'Mumbai',
            'Delhi',
            'Pune',
        ]
        
        self.stdout.write('Creating campuses...')
        for campus_name in campuses_data:
            try:
                Campus.objects.get_or_create(name=campus_name)
                self.stdout.write(self.style.SUCCESS(f'  ✓ Campus "{campus_name}" created'))
            except IntegrityError:
                self.stdout.write(self.style.WARNING(f'  ⚠ Campus "{campus_name}" already exists'))
        
        # Create admin user
        self.stdout.write('Creating admin user...')
        try:
            admin, created = CustomUser.objects.get_or_create(
                email=admin_email,
                defaults={
                    'role': UserRole.ADMIN,
                    'is_active': True,
                    'is_staff': True,
                    'is_superuser': True,
                }
            )
            
            if created:
                admin.set_password(admin_password)
                admin.save()
                self.stdout.write(self.style.SUCCESS(f'✓ Admin user created: {admin_email}'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠ Admin user already exists: {admin_email}'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Failed to create admin: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS('✓ Seeding completed successfully!'))
