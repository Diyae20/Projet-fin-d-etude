from datetime import datetime, timedelta, time
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rendezvous.models import RendezVous
from medecins.models import Medecin
from rendezvous.serializers import RendezVousListSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def priority_booking(request):
    """
    Permet à un patient de prendre un créneau disponible ou de déplacer un rendez-vous de priorité basse
    Cette vue est utilisée pour les rendez-vous de priorité moyenne (suivi) et urgente
    """
    try:
        # Récupérer les données de la requête
        medecin_id = request.data.get('medecin_id')
        patient_id = request.data.get('patient_id')
        priority = request.data.get('priority', 'moyenne')
        type_consultation = request.data.get('type_consultation', None)

        # Vérifier que l'utilisateur est bien le patient connecté
        if request.user.id != int(patient_id):
            return Response({
                'error': 'Vous ne pouvez créer que vos propres rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

        # Récupérer le médecin pour vérifier ses jours de travail
        try:
            medecin = Medecin.objects.get(user_id=medecin_id)
        except Medecin.DoesNotExist:
            return Response({
                'error': 'Médecin non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)

        # Fonction pour vérifier si le médecin travaille un jour donné
        def is_medecin_working_day(date_obj, medecin):
            """
            Vérifie si le médecin travaille un jour donné
            """
            weekday = date_obj.weekday()  # 0 = Lundi, 6 = Dimanche

            # Mapping des jours de la semaine
            day_mapping = {
                0: ('lundi_actif', 'lundi_debut', 'lundi_fin'),
                1: ('mardi_actif', 'mardi_debut', 'mardi_fin'),
                2: ('mercredi_actif', 'mercredi_debut', 'mercredi_fin'),
                3: ('jeudi_actif', 'jeudi_debut', 'jeudi_fin'),
                4: ('vendredi_actif', 'vendredi_debut', 'vendredi_fin'),
                5: ('samedi_actif', 'samedi_debut', 'samedi_fin'),
                6: ('dimanche_actif', 'dimanche_debut', 'dimanche_fin'),
            }

            actif_field, debut_field, fin_field = day_mapping[weekday]

            # Vérifier si le médecin travaille ce jour
            return getattr(medecin, actif_field, False)

        # Fonction pour obtenir les créneaux disponibles pour un jour donné
        def get_available_slots(date_obj, medecin):
            """
            Retourne la liste des créneaux horaires disponibles pour un jour donné
            """
            # Récupérer les heures de travail du médecin pour ce jour
            weekday = date_obj.weekday()  # 0 = Lundi, 6 = Dimanche

            # Mapping des jours de la semaine
            day_mapping = {
                0: ('lundi_debut', 'lundi_fin'),
                1: ('mardi_debut', 'mardi_fin'),
                2: ('mercredi_debut', 'mercredi_fin'),
                3: ('jeudi_debut', 'jeudi_fin'),
                4: ('vendredi_debut', 'vendredi_fin'),
                5: ('samedi_debut', 'samedi_fin'),
                6: ('dimanche_debut', 'dimanche_fin'),
            }

            debut_field, fin_field = day_mapping[weekday]
            debut_heure = getattr(medecin, debut_field, time(8, 0))
            fin_heure = getattr(medecin, fin_field, time(18, 0))

            # Convertir les heures en minutes pour faciliter les calculs
            debut_minutes = debut_heure.hour * 60 + debut_heure.minute
            fin_minutes = fin_heure.hour * 60 + fin_heure.minute

            # Créer une liste de créneaux possibles en fonction des heures de travail
            possible_hours = []
            current_minutes = debut_minutes
            while current_minutes < fin_minutes:
                hour = current_minutes // 60
                minute = current_minutes % 60
                possible_hours.append(f"{hour:02d}:{minute:02d}")
                current_minutes += 30  # Créneaux de 30 minutes

            # Récupérer les heures déjà prises pour ce jour
            existing_hours = RendezVous.objects.filter(
                medecin_id=medecin_id,
                date=date_obj,
                statut__in=['confirme', 'en_attente']  # Ne considérer que les rendez-vous confirmés ou en attente
            ).values_list('heure', flat=True)

            # Retourner les créneaux disponibles (ceux qui ne sont pas pris)
            return [hour for hour in possible_hours if hour not in existing_hours]

        # ÉTAPE 1: Chercher d'abord un créneau disponible dans les 24 heures
        current_date = datetime.now().date()
        next_day = current_date + timedelta(days=1)

        # Chercher un créneau disponible pour aujourd'hui ou demain
        for search_date in [current_date, next_day]:
            # Vérifier si le médecin travaille ce jour
            if not is_medecin_working_day(search_date, medecin):
                continue

            # Récupérer les créneaux disponibles pour cette date
            available_slots = get_available_slots(search_date, medecin)

            if available_slots:
                # Créer directement le rendez-vous dans le premier créneau disponible
                new_rdv = RendezVous.objects.create(
                    medecin_id=medecin_id,
                    patient_id=patient_id,
                    date=search_date,
                    heure=available_slots[0],
                    priorite=priority,
                    type_consultation=type_consultation,
                    statut='en_attente'  # Le rendez-vous est initialement en attente
                )

                # Sérialiser le nouveau rendez-vous
                serializer = RendezVousListSerializer(new_rdv)

                return Response({
                    'success': True,
                    'message': 'Rendez-vous créé avec succès dans un créneau disponible',
                    'rendezvous': serializer.data
                })

        # ÉTAPE 2: Si aucun créneau disponible dans les 24 heures, chercher un rendez-vous de priorité basse à déplacer
        # dans les 7 jours suivants
        max_days = 7
        end_date = current_date + timedelta(days=max_days)

        # Récupérer tous les rendez-vous du médecin dans cette période
        rendezvous_list = RendezVous.objects.filter(
            medecin_id=medecin_id,
            date__gte=current_date,
            date__lte=end_date,
            priorite='basse',
            statut__in=['confirme', 'en_attente']
        ).exclude(patient_id=patient_id)

        if not rendezvous_list.exists():
            return Response({
                'error': 'Aucun rendez-vous échangeable trouvé'
            }, status=status.HTTP_404_NOT_FOUND)

        # Trouver le premier rendez-vous échangeable
        exchangeable_rdv = rendezvous_list.first()

        # Trouver un nouveau créneau pour le patient dont le rendez-vous va être déplacé
        # en commençant par la date du rendez-vous échangeable
        search_date = exchangeable_rdv.date
        new_date_for_exchangeable = None
        new_heure_for_exchangeable = None

        for day in range(max_days):
            # Ignorer les jours où le médecin ne travaille pas
            if not is_medecin_working_day(search_date, medecin):
                search_date = search_date + timedelta(days=1)
                continue

            # Récupérer les créneaux disponibles pour cette date
            available_slots = get_available_slots(search_date, medecin)

            if available_slots:
                # Utiliser le premier créneau disponible
                new_date_for_exchangeable = search_date
                new_heure_for_exchangeable = available_slots[0]
                break

            # Passer au jour suivant
            search_date = search_date + timedelta(days=1)

        # Si aucun créneau disponible n'a été trouvé, créer un nouveau créneau
        if not new_date_for_exchangeable:
            # Trouver le premier jour disponible où le médecin travaille
            search_date = exchangeable_rdv.date + timedelta(days=1)
            found_date = False

            for day in range(max_days):
                # Ignorer les jours où le médecin ne travaille pas
                if not is_medecin_working_day(search_date, medecin):
                    search_date = search_date + timedelta(days=1)
                    continue

                # Récupérer les créneaux disponibles pour cette date
                available_slots = get_available_slots(search_date, medecin)

                if available_slots:
                    # Utiliser le premier créneau disponible
                    new_date_for_exchangeable = search_date
                    new_heure_for_exchangeable = available_slots[0]
                    found_date = True
                    break

                # Passer au jour suivant
                search_date = search_date + timedelta(days=1)

            if not found_date:
                return Response({
                    'error': 'Impossible de trouver un créneau disponible pour déplacer le rendez-vous existant'
                }, status=status.HTTP_404_NOT_FOUND)

        # Sauvegarder l'ancienne date et heure du rendez-vous échangeable
        old_exchangeable_rdv_date = exchangeable_rdv.date
        old_exchangeable_rdv_heure = exchangeable_rdv.heure

        # 1. Déplacer le rendez-vous échangeable vers le nouveau créneau
        exchangeable_rdv.date = new_date_for_exchangeable
        exchangeable_rdv.heure = new_heure_for_exchangeable
        exchangeable_rdv.save()

        # 2. Créer un nouveau rendez-vous pour le patient connecté dans le créneau libéré
        new_rdv = RendezVous.objects.create(
            medecin_id=medecin_id,
            patient_id=patient_id,
            date=old_exchangeable_rdv_date,
            heure=old_exchangeable_rdv_heure,
            priorite=priority,
            type_consultation=type_consultation,
            statut='en_attente'  # Le rendez-vous est initialement en attente
        )

        # 3. Sérialiser le nouveau rendez-vous
        serializer = RendezVousListSerializer(new_rdv)

        return Response({
            'success': True,
            'message': 'Rendez-vous créé avec succès en déplaçant un rendez-vous existant',
            'rendezvous': serializer.data
        })
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la création du rendez-vous: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
