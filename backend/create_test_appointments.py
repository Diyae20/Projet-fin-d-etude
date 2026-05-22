import os
import django
from datetime import date, timedelta, time
from users.models import User
from rendezvous.models import RendezVous

# Configuration de Django
# Essayer différents chemins possibles pour les paramètres
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()
except:
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Projet-fin-d-etude.backend.settings')
        django.setup()
    except:
        try:
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
            django.setup()
        except:
            print("Impossible de trouver les paramètres de Django. Veuillez vérifier le chemin vers les paramètres.")
            print("Chemins essayés:")
            print("  - backend.settings")
            print("  - Projet-fin-d-etude.backend.settings")
            print("  - config.settings")
            exit(1)

def create_test_appointments():
    """
    Crée des rendez-vous de test pour le médecin avec l'ID 2
    """
    # Récupérer le médecin avec l'ID 2
    try:
        medecin = User.objects.get(id=2, role='medecin')
        print(f"Médecin trouvé: {medecin.first_name} {medecin.last_name}")
    except User.DoesNotExist:
        print("Aucun médecin avec l'ID 2 trouvé")
        return

    # Créer des rendez-vous de test pour les 7 prochains jours
    start_date = date.today()

    # Créer 3 rendez-vous par jour (matin, midi, après-midi)
    time_slots = [time(9, 0), time(12, 0), time(15, 0)]

    for day in range(7):
        current_date = start_date + timedelta(days=day)

        # Ignorer les dimanches (jour 6 de la semaine en Python)
        if current_date.weekday() == 6:
            print(f"Ignorant dimanche: {current_date}")
            continue

        for time_slot in time_slots:
            # Créer un rendez-vous avec une priorité basse
            rendezvous = RendezVous.objects.create(
                medecin=medecin,
                date=current_date,
                heure=time_slot,
                statut='confirme',
                priorite='basse',
                type_consultation='consultation',
                motif='Consultation de routine'
            )
            print(f"Rendez-vous créé: {current_date} à {time_slot} avec priorité basse")

    print("Création des rendez-vous de test terminée")

if __name__ == '__main__':
    create_test_appointments()
