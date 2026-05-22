from django.core.management.base import BaseCommand
from users.models import User
from rendezvous.models import RendezVous

class Command(BaseCommand):
    help = 'Met à jour le médecin associé pour tous les patients basé sur leurs rendez-vous'

    def handle(self, *args, **options):
        patients = User.objects.filter(role='patient')
        updated_count = 0
        
        for patient in patients:
            # Récupérer le dernier rendez-vous du patient
            last_rdv = RendezVous.objects.filter(patient=patient).order_by('-date').first()
            
            if last_rdv and last_rdv.medecin:
                patient.medecin = last_rdv.medecin
                patient.save()
                updated_count += 1
                self.stdout.write(f'Patient {patient} mis à jour avec le médecin {last_rdv.medecin}')
        
        self.stdout.write(self.style.SUCCESS(f'{updated_count} patients ont été mis à jour avec succès.'))
