from django.core.management.base import BaseCommand
from users.models import User
from medecins.models import Medecin


class Command(BaseCommand):
    help = 'Crée des profils médecin pour les utilisateurs avec le rôle médecin mais sans profil'

    def handle(self, *args, **options):
        # Trouver tous les utilisateurs avec le rôle médecin
        medecin_users = User.objects.filter(role='medecin')

        created_count = 0
        already_exists_count = 0

        for user in medecin_users:
            # Vérifier si l'utilisateur a déjà un profil médecin
            try:
                Medecin.objects.get(user=user)
                already_exists_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Le profil médecin existe déjà pour {user.username}')
                )
            except Medecin.DoesNotExist:
                # Créer un profil médecin pour cet utilisateur
                Medecin.objects.create(user=user)
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Profil médecin créé pour {user.username}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Opération terminée : {created_count} profils créés, {already_exists_count} existaient déjà.'
            )
        )
