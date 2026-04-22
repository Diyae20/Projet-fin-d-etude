
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

User = get_user_model()

class Command(BaseCommand):
    help = 'Crée des utilisateurs de test pour le système'

    def handle(self, *args, **options):
        # Créer un superutilisateur
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123',
                first_name='Admin',
                last_name='User'
            )
            Token.objects.get_or_create(user=admin)
            self.stdout.write(self.style.SUCCESS('Superutilisateur créé: admin/admin123'))
        else:
            self.stdout.write(self.style.WARNING('Le superutilisateur existe déjà'))

        # Créer un médecin de test
        if not User.objects.filter(username='medecin1').exists():
            medecin = User.objects.create_user(
                username='medecin1',
                email='medecin1@example.com',
                password='medecin123',
                first_name='Jean',
                last_name='Dupont',
                role='medecin',
                phone='0123456789'
            )
            from medecins.models import Medecin
            Medecin.objects.create(user=medecin, specialite='Généraliste')
            Token.objects.get_or_create(user=medecin)
            self.stdout.write(self.style.SUCCESS('Médecin créé: medecin1/medecin123'))
        else:
            self.stdout.write(self.style.WARNING('Le médecin existe déjà'))

        # Créer un réceptionniste de test
        if not User.objects.filter(username='reception1').exists():
            reception = User.objects.create_user(
                username='reception1',
                email='reception1@example.com',
                password='reception123',
                first_name='Marie',
                last_name='Martin',
                role='reception',
                phone='0123456789'
            )
            Token.objects.get_or_create(user=reception)
            self.stdout.write(self.style.SUCCESS('Réceptionniste créé: reception1/reception123'))
        else:
            self.stdout.write(self.style.WARNING('Le réceptionniste existe déjà'))

        # Créer un patient de test
        if not User.objects.filter(username='patient1').exists():
            patient = User.objects.create_user(
                username='patient1',
                email='patient1@example.com',
                password='patient123',
                first_name='Pierre',
                last_name='Durand',
                role='patient',
                phone='0123456789'
            )
            Token.objects.get_or_create(user=patient)
            self.stdout.write(self.style.SUCCESS('Patient créé: patient1/patient123'))
        else:
            self.stdout.write(self.style.WARNING('Le patient existe déjà'))

        self.stdout.write(self.style.SUCCESS('Utilisateurs de test créés avec succès!'))
