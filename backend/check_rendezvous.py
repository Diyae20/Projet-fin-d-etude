import os
import django
from datetime import date
from users.models import User
from rendezvous.models import RendezVous

# Configuration de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def check_rendezvous():
    """
    Vérifie les rendez-vous dans la base de données
    """
    # Récupérer tous les médecins
    medecins = User.objects.filter(role='medecin')
    print(f"Nombre de médecins dans la base de données: {medecins.count()}")

    for medecin in medecins:
        print(f"Médecin: {medecin.first_name} {medecin.last_name} (ID: {medecin.id})")

        # Récupérer tous les rendez-vous pour ce médecin
        rendezvous = RendezVous.objects.filter(medecin=medecin)
        print(f"Nombre de rendez-vous: {rendezvous.count()}")

        # Afficher les rendez-vous pour la date 2026-05-04
        date_specifique = date(2026, 5, 4)
        rendezvous_date = rendezvous.filter(date=date_specifique)
        print(f"Nombre de rendez-vous pour le {date_specifique}: {rendezvous_date.count()}")

        for rdv in rendezvous_date:
            print(f"  - Rendez-vous ID: {rdv.id}, Date: {rdv.date}, Heure: {rdv.heure}, Statut: {rdv.statut}, Priorité: {rdv.priorite}")

if __name__ == '__main__':
    check_rendezvous()
