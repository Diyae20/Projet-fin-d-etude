
from django.core.management.base import BaseCommand
from users.models import User
import random
import string


class Command(BaseCommand):
    help = "Genere des codes uniques pour tous les medecins qui n'en ont pas"

    def handle(self, *args, **options):
        # Recuperer tous les medecins sans code unique
        medecins_sans_code = User.objects.filter(role="medecin", code_unique__isnull=True)

        if not medecins_sans_code.exists():
            self.stdout.write(self.style.SUCCESS("Tous les medecins ont deja un code unique."))
            return

        self.stdout.write(f"Generation de codes uniques pour {medecins_sans_code.count()} medecins...")

        for medecin in medecins_sans_code:
            # Generer un code unique
            code = self.generate_unique_code()
            medecin.code_unique = code
            medecin.save()
            self.stdout.write(f"Code genere pour {medecin.username}: {code}")

        self.stdout.write(self.style.SUCCESS("Codes uniques generes avec succes !"))

    def generate_unique_code(self):
        """
        Generer un code unique pour le medecin
        """
        while True:
            # Generer un code de 8 caracteres alphanumeriques
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
            # Verifier que le code est unique
            if not User.objects.filter(code_unique=code).exists():
                return code
