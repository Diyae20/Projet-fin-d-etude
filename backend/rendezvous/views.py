from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime, timedelta, time
from .models import RendezVous, NotePatient, NotificationUrgente
from .serializers import (
    RendezVousSerializer,
    RendezVousListSerializer,
    NotePatientSerializer,
    NotificationUrgenteSerializer
)
from users.models import User
from medecins.models import Medecin


class RendezVousListView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des rendez-vous
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'date', 'medecin']
    search_fields = ['motif', 'medecin__first_name', 'medecin__last_name']
    ordering_fields = ['date', 'heure', 'cree_le']
    ordering = ['date', 'heure']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return RendezVousListSerializer
        return RendezVousSerializer

    def get_queryset(self):
        """
        Un patient voit ses rendez-vous, un médecin voit les siens, un admin voit tous
        """
        user = self.request.user

        if user.is_admin:
            return RendezVous.objects.all()
        elif user.is_medecin:
            return RendezVous.objects.filter(medecin=user)
        elif user.is_patient:
            return RendezVous.objects.filter(patient=user, visible_for_patient=True).exclude(statut='annulé')
        else:
            return RendezVous.objects.none()

    def perform_create(self, serializer):
        """
        Créer un rendez-vous avec l'utilisateur connecté comme patient
        """
        print(f"Utilisateur connecté: {self.request.user}")
        print(f"Est patient: {self.request.user.is_patient}")
        print(f"Données reçues: {self.request.data}")
        
        if not self.request.user.is_patient:
            return Response({
                'error': 'Seuls les patients peuvent créer des rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

        # Le sérialiseur gère déjà l'attribution du patient et du médecin
        print(f"Tentative de création de rendez-vous avec le sérialiseur")
        result = serializer.save()
        
        # Incrémenter le nombre total de rendez-vous du patient
        if result.patient:
            result.patient.total_rendezvous_count += 1
            result.patient.save()
        
        print(f"Rendez-vous créé: {result}")
        return result


class RendezVousDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour consulter, mettre à jour ou supprimer un rendez-vous
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return RendezVousListSerializer
        return RendezVousSerializer

    def get_queryset(self):
        """
        Un patient voit ses rendez-vous, un médecin voit les siens, un admin voit tous
        """
        user = self.request.user

        if user.is_admin or user.is_reception:
            return RendezVous.objects.all()
        elif user.is_medecin:
            # Exclure les rendez-vous avec le statut "passe"
            return RendezVous.objects.filter(medecin=user).exclude(statut='passe')
        elif user.is_patient:
            # Pour les requêtes DELETE, inclure tous les rendez-vous du patient
            if self.request.method == 'DELETE':
                return RendezVous.objects.filter(patient=user)
            # Exclure les rendez-vous annulés pour les autres requêtes
            return RendezVous.objects.filter(patient=user, visible_for_patient=True).exclude(statut='annule')
        else:
            return RendezVous.objects.none()

    def perform_update(self, serializer):
        """
        Mettre à jour un rendez-vous avec des permissions basées sur le rôle
        """
        user = self.request.user
        rdv = self.get_object()

        # Les patients ne peuvent qu'annuler leurs rendez-vous
        if user.is_patient and 'statut' in self.request.data:
            if self.request.data['statut'] != 'annule':
                return Response({
                    'error': 'Les patients ne peuvent qu\'annuler leurs rendez-vous'
                }, status=status.HTTP_403_FORBIDDEN)

        # Les médecins peuvent mettre à jour le statut et ajouter des notes
        if user.is_medecin and rdv.medecin != user:
            return Response({
                'error': 'Vous n\'êtes pas le médecin de ce rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer.save()

    def perform_destroy(self, instance):
        """
        Supprimer un rendez-vous définitivement si c'est un patient et que le statut est "passe" ou "annule"
        Sinon, annuler un rendez-vous au lieu de le supprimer
        """
        user = self.request.user

        # Vérifier les permissions
        if user.is_patient and instance.patient != user:
            return Response({
                'error': 'Ce n\'est pas votre rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

        if user.is_medecin and instance.medecin != user:
            return Response({
                'error': 'Vous n\'êtes pas le médecin de ce rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

        # Si c'est un patient et que le statut est "passe" ou "annule", supprimer définitivement
        if user.is_patient and (instance.statut == 'passe' or instance.statut == 'annule'):
            instance.visible_for_patient = False
            instance.save()
        else:
            # Marquer comme annulé au lieu de supprimer
            instance.statut = 'annule'
            instance.save()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_medecin_rendezvous(request, medecin_id=None):
    """
    Récupérer les rendez-vous d'un médecin spécifique ou du médecin connecté
    """
    user = request.user

    # Vérifier les permissions
    if not (user.is_admin or user.is_medecin or user.is_reception):
        return Response({
            'error': 'Vous n\'avez pas la permission de voir ces rendez-vous'
        }, status=status.HTTP_403_FORBIDDEN)

    # Si aucun ID n'est spécifié, utiliser l'ID du médecin connecté
    if medecin_id is None:
        medecin_id = user.id
    else:
        # Si c'est un médecin, vérifier qu'il consulte ses propres rendez-vous
        if user.is_medecin and user.id != int(medecin_id):
            return Response({
                'error': 'Vous ne pouvez consulter que vos propres rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

    # Récupérer les rendez-vous
    rendezvous = RendezVous.objects.filter(medecin_id=medecin_id)

    # Filtrer par date si spécifiée
    date_str = request.query_params.get('date', None)
    if date_str:
        from datetime import datetime
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            rendezvous = rendezvous.filter(date=date_obj)
        except ValueError:
            return Response({
                'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Sérialiser les rendez-vous
    serializer_data = []
    for rdv in rendezvous:
        # Récupérer les informations du patient
        patient_data = None
        if rdv.patient:
            patient_data = {
                'id': rdv.patient.id,
                'first_name': rdv.patient.first_name,
                'last_name': rdv.patient.last_name,
                'email': rdv.patient.email,
                'phone': rdv.patient.phone,
            }
        
        serializer_data.append({
            'id': rdv.id,
            'date': str(rdv.date),
            'heure': str(rdv.heure),
            'statut': rdv.statut,
            'priorite': rdv.priorite,
            'type_consultation': rdv.type_consultation,
            'patient': patient_data,
            'patient_id': rdv.patient_id,
        })

    return Response(serializer_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_medecin_rendezvous_public(request, medecin_id):
    """
    Récupérer les rendez-vous d'un médecin spécifique pour les patients
    Ne retourne que les informations nécessaires pour trouver des créneaux disponibles
    """
    from datetime import datetime

    user = request.user

    # Vérifier que l'utilisateur est authentifié (déjà fait par le décorateur @permission_classes([IsAuthenticated]))
    # Tous les utilisateurs authentifiés peuvent voir les créneaux disponibles sans informations confidentielles

    # Récupérer les rendez-vous
    print(f"DEBUG: Récupération des rendez-vous pour le médecin avec ID: {medecin_id}")
    rendezvous = RendezVous.objects.filter(medecin__id=medecin_id)
    print(f"DEBUG: Nombre de rendez-vous trouvés: {rendezvous.count()}")

    # Filtrer par date si spécifiée
    date_str = request.query_params.get('date', None)
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            rendezvous = rendezvous.filter(date=date_obj)
        except ValueError:
            return Response({
                'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Sérialiser les rendez-vous sans informations confidentielles
    serializer_data = []
    for rdv in rendezvous:
        serializer_data.append({
            'id': rdv.id,
            'date': str(rdv.date),
            'heure': str(rdv.heure),
            'statut': rdv.statut,
            'priorite': rdv.priorite,
            'type_consultation': rdv.type_consultation,
            'patient_id': rdv.patient_id,  # Inclure l'ID du patient pour permettre l'échange de rendez-vous
            # On n'inclut pas les informations personnelles du patient pour préserver la confidentialité
        })

    return Response(serializer_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_rendezvous(request, patient_id):
    """
    Récupérer les rendez-vous d'un patient spécifique
    """
    user = request.user

    # Vérifier les permissions
    if not (user.is_admin or user.is_medecin or user.is_reception):
        return Response({
            'error': 'Vous n\'avez pas la permission de voir ces rendez-vous'
        }, status=status.HTTP_403_FORBIDDEN)

    # Si c'est un patient, vérifier qu'il consulte ses propres rendez-vous
    if user.is_patient and user.id != int(patient_id):
        return Response({
            'error': 'Vous ne pouvez consulter que vos propres rendez-vous'
        }, status=status.HTTP_403_FORBIDDEN)

    # Vérifier si on doit inclure les rendez-vous supprimés (statut "passe")
    include_deleted = request.query_params.get('include_deleted', 'false').lower() == 'true'

    # Récupérer les rendez-vous
    if include_deleted:
        # Inclure tous les rendez-vous, y compris ceux avec le statut "passe"
        rendezvous = RendezVous.objects.filter(patient_id=patient_id)
    else:
        # Exclure les rendez-vous avec le statut "passe"
        rendezvous = RendezVous.objects.filter(patient_id=patient_id).exclude(statut='passe')

        
    serializer = RendezVousListSerializer(rendezvous, many=True)
    
    return Response(serializer.data)    


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_patient_rendezvous(request):
    """
    Récupérer tous les rendez-vous du patient connecté, y compris ceux passés
    """
    user = request.user

    # Vérifier que l'utilisateur est un patient
    if not user.is_patient:
        return Response({
            'error': 'Seuls les patients peuvent accéder à cette ressource'
        }, status=status.HTTP_403_FORBIDDEN)

    # Récupérer tous les rendez-vous du patient, y compris ceux passés
    rendezvous = RendezVous.objects.filter(patient=user, visible_for_patient=True)

    # Trier les rendez-vous par date décroissante
    rendezvous = rendezvous.order_by('-date')

    # Sérialiser les rendez-vous
    serializer = RendezVousListSerializer(rendezvous, many=True)

    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([])  # Permettre l'accès sans authentification
def get_medecin_disponibilite_par_jour(request):
    """
    Récupérer les informations sur le nombre de patients par jour pour un médecin
    sur une période donnée pour permettre l'affichage coloré dans le calendrier
    """
    from datetime import datetime, timedelta, date
    from medecins.models import Medecin

    medecin_id = request.query_params.get('medecin_id')
    date_debut_str = request.query_params.get('date_debut')
    date_fin_str = request.query_params.get('date_fin')

    if not medecin_id:
        return Response({
            'error': 'Veuillez spécifier un médecin'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Essayer d'abord de récupérer le profil du médecin avec l'ID fourni
        try:
            medecin_profile = Medecin.objects.get(id=medecin_id)
            max_patients = medecin_profile.max_patients_par_jour or 10  # 10 patients par défaut
            medecin_user = medecin_profile.user
        except Medecin.DoesNotExist:
            # Si le profil n'existe pas, essayer de trouver un utilisateur avec l'ID fourni et le rôle 'medecin'
            try:
                medecin_user = User.objects.get(id=medecin_id, role='medecin')
                max_patients = 10  # 10 patients par défaut
            except User.DoesNotExist:
                return Response({
                    'error': 'Médecin non trouvé'
                }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la récupération du médecin: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Définir la période par défaut (30 jours à partir d'aujourd'hui)
    today = date.today()
    if not date_debut_str:
        date_debut = today
    else:
        try:
            date_debut = datetime.strptime(date_debut_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)

    if not date_fin_str:
        date_fin = today + timedelta(days=30)
    else:
        try:
            date_fin = datetime.strptime(date_fin_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Récupérer le nombre de rendez-vous pour chaque jour dans la période
    disponibilites = {}
    date_check = date_debut
    while date_check <= date_fin:
        date_str = date_check.strftime('%Y-%m-%d')
        rendezvous_count = RendezVous.objects.filter(
            medecin_id=medecin_user.id,
            date=date_str,
            statut__in=['confirme', 'en_attente']
        ).count()
        
        # Déterminer le niveau de disponibilité
        niveau_disponibilite = 'disponible'  # vert
        if rendezvous_count >= max_patients:
            niveau_disponibilite = 'complet'  # rouge
        elif rendezvous_count >= max_patients * 0.8:
            niveau_disponibilite = 'presque_complet'  # orange
        
        disponibilites[date_str] = {
            'patients_actuels': rendezvous_count,
            'max_patients': max_patients,
            'niveau_disponibilite': niveau_disponibilite
        }
        
        date_check += timedelta(days=1)

    return Response({
        'medecin_id': medecin_id,
        'date_debut': date_debut.strftime('%Y-%m-%d'),
        'date_fin': date_fin.strftime('%Y-%m-%d'),
        'disponibilites': disponibilites
    })


@api_view(['GET'])
@permission_classes([])  # Permettre l'accès sans authentification
def get_rendezvous_disponibles(request):
    """
    Récupérer les créneaux disponibles pour un médecin à une date donnée
    en vérifiant le nombre maximum de patients par jour
    """
    from datetime import datetime, timedelta, date
    from medecins.models import Medecin

    medecin_id = request.query_params.get('medecin_id')
    date_str = request.query_params.get('date')

    if not medecin_id or not date_str:
        return Response({
            'error': 'Veuillez spécifier un médecin et une date'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Convertir la chaîne de date en objet date
        selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({
            'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Vérifier si la date est dans le passé
    today = date.today()
    if selected_date < today:
        return Response({
            'error': 'Impossible de prendre rendez-vous pour une date passée',
            'date_passee': True
        }, status=status.HTTP_400_BAD_REQUEST)

    # Essayer d'abord de récupérer le profil du médecin avec l'ID fourni
    medecin_profile = None
    try:
        medecin_profile = Medecin.objects.get(id=medecin_id)
        duree_consultation = medecin_profile.duree_consultation or 30  # 30 minutes par défaut
        max_patients = medecin_profile.max_patients_par_jour or 10  # 10 patients par défaut
        medecin_user = medecin_profile.user
    except Medecin.DoesNotExist:
        # Si le profil n'existe pas, essayer de trouver un utilisateur avec l'ID fourni et le rôle 'medecin'
        try:
            medecin_user = User.objects.get(id=medecin_id, role='medecin')
            duree_consultation = 30  # 30 minutes par défaut
            max_patients = 10  # 10 patients par défaut
        except User.DoesNotExist:
            return Response({
                'error': 'Médecin non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la récupération du médecin: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Récupérer les rendez-vous déjà pris pour ce médecin à cette date
    rendezvous_pris = RendezVous.objects.filter(
        medecin_id=medecin_user.id,
        date=selected_date,
        statut__in=['confirme', 'en_attente']
    ).values_list('heure', flat=True)

    # Vérifier si le nombre maximum de patients est atteint
    if len(rendezvous_pris) >= max_patients:
        # Trouver les prochaines dates disponibles
        prochaines_dates_disponibles = []
        date_check = today + timedelta(days=1)

        # Chercher les 7 prochaines dates disponibles
        while len(prochaines_dates_disponibles) < 7 and date_check <= today + timedelta(days=30):
            # Compter le nombre de rendez-vous pour cette date
            rendezvous_count = RendezVous.objects.filter(
                medecin_id=medecin_user.id,
                date=date_check,
                statut__in=['confirme', 'en_attente']
            ).count()

            if rendezvous_count < max_patients:
                # Formater le nom du jour
                jour_nom = date_check.strftime('%A')
                jour_fr = {
                    'Monday': 'Lundi',
                    'Tuesday': 'Mardi',
                    'Wednesday': 'Mercredi',
                    'Thursday': 'Jeudi',
                    'Friday': 'Vendredi',
                    'Saturday': 'Samedi',
                    'Sunday': 'Dimanche'
                }.get(jour_nom, jour_nom)

                prochaines_dates_disponibles.append({
                    'date': date_check.strftime('%Y-%m-%d'),
                    'jour': jour_fr,
                    'jour_numero': date_check.day,
                    'mois': date_check.strftime('%m'),
                    'annee': date_check.strftime('%Y')
                })

            date_check += timedelta(days=1)

        return Response({
            'medecin_id': medecin_user.id,
            'date': date_str,
            'creneaux': [],
            'date_complete': True,
            'message': f'Désolé, le médecin a déjà atteint son maximum de {max_patients} patients pour cette date.',
            'prochaines_dates': prochaines_dates_disponibles
        })

    # Récupérer les horaires du médecin pour ce jour spécifique
    jours_semaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
    jour_semaine = jours_semaine[selected_date.weekday()]

    # Récupérer les horaires depuis le profil du médecin
    # Utiliser des valeurs par défaut si medecin_profile est None
    jour_actif = getattr(medecin_profile, f'{jour_semaine}_actif', True) if medecin_profile else True
    jour_debut = getattr(medecin_profile, f'{jour_semaine}_debut', '08:00') if medecin_profile else '08:00'
    jour_fin = getattr(medecin_profile, f'{jour_semaine}_fin', '23:59') if medecin_profile else '23:59' 

    # Vérifier si le médecin travaille ce jour-là
    if not jour_actif:
        return Response({
            'medecin_id': medecin_user.id,
            'date': date_str,
            'creneaux': [],
            'date_complete': True,
            'message': f'Le médecin ne travaille pas les {jour_semaine}s'
        })

    # Générer des créneaux horaires en fonction des horaires du médecin
    creneaux_disponibles = []
    if isinstance(jour_debut, str):
        debut = datetime.strptime(jour_debut, '%H:%M').time()
    else:
        debut = jour_debut


    if isinstance(jour_fin, str):
        fin = datetime.strptime(jour_fin, '%H:%M').time()
    else:
        fin = jour_fin    

    current = datetime.combine(datetime.min, debut)
    end_time = datetime.combine(datetime.min, fin)
    
    # Obtenir l'heure actuelle pour filtrer les créneaux passés du jour en cours
    now = datetime.now().time()
    is_today = selected_date == today

    while current < end_time:
        heure = current.time()
        # Si c'est aujourd'hui, ne pas afficher les créneaux passés
        if is_today and heure < now:
            current += timedelta(minutes=duree_consultation)
            continue
            
        if heure not in rendezvous_pris:
            creneaux_disponibles.append({
                'heure': heure.strftime('%H:%M'),
                'disponible': True
            })
        current += timedelta(minutes=duree_consultation)

    return Response({
        'medecin_id': medecin_user.id,
        'date': date_str,
        'creneaux': creneaux_disponibles,
        'date_complete': False,
        'max_patients': max_patients,
        'patients_actuels': len(rendezvous_pris)
    })


class NotePatientListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des notes pour les patients
    """
    serializer_class = NotePatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Récupérer les notes en fonction de l'utilisateur connecté
        """
        user = self.request.user
        patient_id = self.request.query_params.get('patient_id', None)
        medecin_id = self.request.query_params.get('medecin_id', None)

        # Si l'utilisateur est un médecin, il peut voir ses propres notes
        if user.is_medecin:
            queryset = NotePatient.objects.filter(medecin=user)
            if patient_id:
                queryset = queryset.filter(patient_id=patient_id)
        # Si l'utilisateur est un patient, il peut voir les notes que les médecins ont écrites pour lui
        elif user.is_patient:
            queryset = NotePatient.objects.filter(patient=user)
            if medecin_id:
                queryset = queryset.filter(medecin_id=medecin_id)
        # Sinon, retourner une liste vide
        else:
            queryset = NotePatient.objects.none()

        return queryset

    def perform_create(self, serializer):
        """
        Créer une note en définissant le médecin comme l'utilisateur connecté
        """
        if not self.request.user.is_medecin:
            raise serializers.ValidationError({
                "detail": "Seuls les médecins peuvent créer des notes pour les patients."
            })
        serializer.save(medecin=self.request.user)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_rendezvous_datetime(request, pk):
    """
    Mettre à jour la date et l'heure d'un rendez-vous
    Cette vue est utilisée pour réorganiser les rendez-vous
    """
    try:
        rdv = RendezVous.objects.get(pk=pk)
    except RendezVous.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    # Vérifier que l'utilisateur a le droit de modifier ce rendez-vous
    user = request.user
    if not (user.is_admin or user.is_medecin):
        return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)

    # Mettre à jour la date et l'heure
    rdv.date = request.data.get('date', rdv.date)
    rdv.heure = request.data.get('heure', rdv.heure)
    rdv.save()

    # Sérialiser le rendez-vous mis à jour
    serializer = RendezVousListSerializer(rdv)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notify_rendezvous_changed(request, pk):
    """
    Envoyer une notification au patient dont le rendez-vous a été modifié
    """
    try:
        rdv = RendezVous.objects.get(pk=pk)
    except RendezVous.DoesNotExist:
        return Response({'error': 'Rendez-vous non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    # Vérifier que l'utilisateur a le droit de notifier ce rendez-vous
    user = request.user
    if not (user.is_admin or user.is_medecin):
        return Response({'error': 'Permission refusée'}, status=status.HTTP_403_FORBIDDEN)

    # Ici, vous pouvez ajouter la logique pour envoyer une notification
    # Par exemple, envoyer un email ou une notification push au patient

    return Response({'success': True, 'message': 'Notification envoyée'})


class NotePatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, mettre à jour ou supprimer une note de patient
    """
    serializer_class = NotePatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Récupérer les notes en fonction de l'utilisateur connecté
        """
        user = self.request.user

        # Si l'utilisateur est un médecin, il peut voir ses propres notes
        if user.is_medecin:
            return NotePatient.objects.filter(medecin=user)
        # Si l'utilisateur est un patient, il peut voir les notes que les médecins ont écrites pour lui
        elif user.is_patient:
            return NotePatient.objects.filter(patient=user)
        # Sinon, retourner une liste vide
        else:
            return NotePatient.objects.none()

    def perform_update(self, serializer):
        """
        Mettre à jour une note en vérifiant que l'utilisateur est le médecin qui a créé la note
        """
        if not self.request.user.is_medecin:
            raise serializers.ValidationError({
                "detail": "Seuls les médecins peuvent modifier des notes."
            })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rendezvous_medecin_date(request, medecin_id, date):
    """
    Récupérer les rendez-vous d'un médecin pour une date donnée
    Cette fonction est utilisée pour trouver des rendez-vous échangeables
    """
    from datetime import datetime

    try:
        # Vérifier que la date est au bon format
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        return Response({
            'error': 'Format de date invalide. Utilisez le format YYYY-MM-DD'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Vérifier que le médecin existe
    try:
        from users.models import User
        medecin = User.objects.get(id=medecin_id, role='medecin')
    except User.DoesNotExist:
        return Response({
            'error': 'Médecin non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)

    # Récupérer les rendez-vous du médecin pour cette date
    rendezvous = RendezVous.objects.filter(
        medecin_id=medecin_id,
        date=date_obj,
        statut__in=['confirme', 'en_attente']
    )

    # Sérialiser les rendez-vous sans inclure les informations du patient
    serializer_data = []
    for rdv in rendezvous:
        serializer_data.append({
            'id': rdv.id,
            'date': rdv.date,
            'heure': rdv.heure,
            'statut': rdv.statut,
            'priorite': rdv.priorite,
            'type_consultation': rdv.type_consultation,
            'patient_id': rdv.patient_id,
        })

    return Response(serializer_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exchange_rendezvous(request):
    """
    Permet à un patient de prendre un créneau occupé par un autre patient en échangeant son propre rendez-vous
    """
    try:
        # Récupérer les données de la requête
        # patient_id: ID du patient connecté (celui qui veut prendre le créneau)
        # old_rdv_id: ID du rendez-vous du patient connecté qui va être échangé
        # new_date: Date du créneau que le patient veut prendre
        # new_heure: Heure du créneau que le patient veut prendre
        patient_id = request.data.get('patient_id')
        old_rdv_id = request.data.get('old_rdv_id')
        new_date = request.data.get('new_date')
        new_heure = request.data.get('new_heure')

        # Vérifier que l'utilisateur est bien le patient connecté
        if request.user.id != int(patient_id):
            return Response({
                'error': 'Vous ne pouvez échanger que vos propres rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

        # Récupérer le rendez-vous du patient connecté qui va être échangé
        old_rdv = RendezVous.objects.get(pk=old_rdv_id)

        # Vérifier que le rendez-vous appartient bien au patient connecté
        if old_rdv.patient_id != int(patient_id):
            return Response({
                'error': 'Ce rendez-vous ne vous appartient pas'
            }, status=status.HTTP_403_FORBIDDEN)

        # Trouver le rendez-vous occupant le créneau que le patient veut prendre
        try:
            target_rdv = RendezVous.objects.get(
                medecin_id=old_rdv.medecin_id,
                date=new_date,
                heure=new_heure,
                statut__in=['confirme', 'en_attente']
            )
        except RendezVous.DoesNotExist:
            # Si le créneau est libre, on peut simplement déplacer le rendez-vous du patient
            old_rdv.date = new_date
            old_rdv.heure = new_heure
            old_rdv.save()

            serializer = RendezVousListSerializer(old_rdv)
            return Response({
                'success': True,
                'message': 'Rendez-vous déplacé avec succès',
                'rendezvous': serializer.data
            })

        # Vérifier que le rendez-vous cible n'appartient pas au patient connecté
        if target_rdv.patient_id == int(patient_id):
            return Response({
                'error': 'Vous ne pouvez pas échanger votre rendez-vous avec lui-même'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Sauvegarder l'ancienne date et heure du rendez-vous du patient
        old_date = old_rdv.date
        old_heure = old_rdv.heure

        # Échanger les rendez-vous
        # 1. Déplacer le rendez-vous du patient vers le créneau souhaité
        old_rdv.date = new_date
        old_rdv.heure = new_heure
        old_rdv.save()

        # 2. Déplacer le rendez-vous de l'autre patient vers l'ancien créneau du patient connecté
        target_rdv.date = old_date
        target_rdv.heure = old_heure
        target_rdv.save()

        # 3. Sérialiser les rendez-vous mis à jour
        serializer = RendezVousListSerializer(old_rdv)

        return Response({
            'success': True,
            'message': 'Rendez-vous échangé avec succès',
            'rendezvous': serializer.data
        })
    except RendezVous.DoesNotExist:
        return Response({
            'error': 'Rendez-vous non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Erreur lors de l\'échange: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def emergency_booking(request):
    """
    Permet à un patient de prendre un créneau disponible ou de déplacer un rendez-vous de priorité basse
    Cette vue est utilisée pour les rendez-vous de priorité urgente (bouton rouge)
    Le système recherche le créneau le plus proche le jour même et échange directement un rendez-vous de priorité basse si nécessaire
    """
    try:
        # Récupérer les données de la requête
        medecin_id = request.data.get('medecin_id')
        patient_id = request.data.get('patient_id')
        priority = request.data.get('priority', 'urgente')
        type_consultation = request.data.get('type_consultation', None)

        # Vérifier que l'utilisateur est bien le patient connecté
        if str(request.user.id) != str(patient_id):
            return Response({
                'error': 'Vous ne pouvez créer que vos propres rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

        # Utiliser directement l'utilisateur connecté comme patient
        patient = request.user

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
            fin_heure = getattr(medecin, fin_field, time(23, 59))

            # Convertir les heures en minutes pour faciliter les calculs
            debut_minutes = debut_heure.hour * 60 + debut_heure.minute
            fin_minutes = fin_heure.hour * 60 + fin_heure.minute

            # Créer une liste de créneaux possibles en fonction des heures de travail
            possible_hours = []
            current_minutes = debut_minutes
            # Utiliser la durée de consultation du médecin (en minutes)
            duree_consultation = getattr(medecin, 'duree_consultation', 60)  # Par défaut 60 minutes
            while current_minutes < fin_minutes:
                hour = current_minutes // 60
                minute = current_minutes % 60
                possible_hours.append(f"{hour:02d}:{minute:02d}")
                current_minutes += duree_consultation  # Utiliser la durée de consultation du médecin

            # Récupérer les heures déjà prises pour ce jour (tous les rendez-vous sauf annulés)
            existing_hours = RendezVous.objects.filter(
                medecin=medecin.user,
                date=date_obj
            ).exclude(statut='annule').values_list('heure', flat=True)
            
            # Log pour débogage
            print(f"DEBUG: possible_hours pour {date_obj}: {possible_hours}")
            print(f"DEBUG: existing_hours pour {date_obj}: {list(existing_hours)}")

            # Convertir les heures existantes en chaînes pour la comparaison
            existing_hours_str = [h.strftime('%H:%M') if hasattr(h, 'strftime') else str(h) for h in existing_hours]
            # Retourner les créneaux disponibles (ceux qui ne sont pas pris)
            available_slots = [hour for hour in possible_hours if hour not in existing_hours_str]
            print(f"DEBUG: available_slots pour {date_obj}: {available_slots}")
            return available_slots

        # Fonction pour trouver le créneau le plus proche à partir de l'heure actuelle
        def find_nearest_available_slot(current_datetime, medecin):
            """
            Trouve le créneau disponible le plus proche à partir de l'heure actuelle le jour même
            """
            current_date = current_datetime.date()
            
            # Vérifier si le médecin travaille aujourd'hui
            if not is_medecin_working_day(current_date, medecin):
                return None, None  # Le médecin ne travaille pas aujourd'hui
            
            # Récupérer les créneaux disponibles pour aujourd'hui
            available_slots = get_available_slots(current_date, medecin)
            
            if not available_slots:
                return None, None  # Aucun créneau disponible aujourd'hui
            
            # Log pour débogage
            print(f"DEBUG: available_slots pour {current_date}: {available_slots}")
            
            # Convertir l'heure actuelle en minutes pour faciliter les calculs
            current_minutes = current_datetime.hour * 60 + current_datetime.minute
            
            # Trouver le premier créneau disponible après l'heure actuelle
            for slot in available_slots:
                slot_hour, slot_minute = map(int, slot.split(':'))
                slot_minutes = slot_hour * 60 + slot_minute
                
                # Vérifier si le créneau est après l'heure actuelle
                if slot_minutes > current_minutes:
                    return current_date, slot
            
            # Si aucun créneau n'est trouvé après l'heure actuelle, retourner None
            return None, None

        # Fonction pour trouver et échanger un rendez-vous de priorité basse
        def find_and_exchange_low_priority_appointment(current_datetime, medecin):
            """
            Trouve un rendez-vous de priorité basse à échanger et le déplace
            """
            current_date = current_datetime.date()
            
            # Récupérer tous les rendez-vous du médecin pour aujourd'hui
            today_appointments = RendezVous.objects.filter(
                medecin=medecin.user,
                date=current_date,
                priorite='basse',
                statut__in=['confirme', 'en_attente']
            ).order_by('heure')
            
            if not today_appointments.exists():
                return None, None  # Aucun rendez-vous de priorité basse à échanger
            
            # Trouver le premier rendez-vous de priorité basse après l'heure actuelle
            current_minutes = current_datetime.hour * 60 + current_datetime.minute
            
            for appointment in today_appointments:
                # Gérer le cas où heure est un objet datetime.time ou une chaîne
                if hasattr(appointment.heure, 'hour'):
                    appointment_hour = appointment.heure.hour
                    appointment_minute = appointment.heure.minute
                else:
                    appointment_hour, appointment_minute = map(int, str(appointment.heure).split(':'))
                appointment_minutes = appointment_hour * 60 + appointment_minute
                
                # Vérifier si le rendez-vous est après l'heure actuelle
                if appointment_minutes > current_minutes:
                    # C'est le rendez-vous à échanger
                    
                    # Trouver un nouveau créneau pour ce patient dans les 7 jours suivants
                    new_date_for_exchangeable = None
                    new_heure_for_exchangeable = None
                    
                    search_date = current_date + timedelta(days=1)
                    max_search_days = 7
                    
                    for day_offset in range(max_search_days):
                        # Vérifier si le médecin travaille ce jour
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
                    
                    if new_date_for_exchangeable and new_heure_for_exchangeable:

                        
                        # Sauvegarder l'heure originale et la date originale avant de déplacer le rendez-vous
                        original_heure = appointment.heure.strftime('%H:%M') if hasattr(appointment.heure, 'strftime') else str(appointment.heure)
                        original_date = appointment.date

                        # Vérifier si le nouveau créneau est disponible
                        existing_rdv = RendezVous.objects.filter(
                            medecin=medecin.user,
                            date=new_date_for_exchangeable,
                            heure=new_heure_for_exchangeable
                        ).first()
                        
                        if existing_rdv:
                            # Le créneau est déjà occupé, ne pas échanger
                            return None, None
                        
                        # Déplacer le rendez-vous de priorité basse
                        appointment.date = new_date_for_exchangeable
                        appointment.heure = new_heure_for_exchangeable
                        appointment.save()
                        


                        # Retourner les informations du créneau libéré (date originale et heure originale)
                        return original_date, original_heure
            
            # Aucun rendez-vous de priorité basse trouvé après l'heure actuelle
            return None, None

        # Obtenir la date et l'heure actuelles
        current_datetime = datetime.now()
        
        # ÉTAPE 1: Chercher d'abord un créneau disponible le plus proche aujourd'hui
        emergency_date, emergency_time = find_nearest_available_slot(current_datetime, medecin)
        
        if emergency_date and emergency_time:
            # Vérifier si le créneau est vraiment disponible
            existing_rdv = RendezVous.objects.filter(
                medecin=medecin.user,
                date=emergency_date,
                heure=emergency_time
            ).first()
            
            if existing_rdv:
                # Le créneau est déjà occupé, passer à l'étape 2 (échange de rendez-vous)
                print(f"DEBUG: Créneau {emergency_time} le {emergency_date} déjà occupé, passage à l'étape 2")
                # Passer directement à l'étape 2
                emergency_date = None
                emergency_time = None
            else:
                # Créer le rendez-vous d'urgence dans ce créneau
                new_rdv = RendezVous.objects.create(
                    medecin=medecin.user,
                    patient_id=patient_id,
                    date=emergency_date,
                    heure=emergency_time,
                    priorite=priority,
                    type_consultation=type_consultation,
                    statut='en_attente'  # Le rendez-vous est initialement en attente
                )

                # Créer une notification urgente pour la réception
                patient_user = User.objects.get(id=patient_id)
                message_notif = f"🚨 RENDEZ-VOUS URGENT - Patient: {patient_user.first_name} {patient_user.last_name} - Dr. {medecin.user.first_name} {medecin.user.last_name} - {emergency_date} à {emergency_time}"
                NotificationUrgente.objects.create(
                    rendezvous=new_rdv,
                    message=message_notif
                )

                # Sérialiser le nouveau rendez-vous
                serializer = RendezVousListSerializer(new_rdv)

                return Response({
                    'success': True,
                    "message": "Rendez-vous d'urgence créé avec succès pour aujourd'hui",
                    'rendezvous': serializer.data
                })

        
        # ÉTAPE 2: Si aucun créneau n'est disponible, chercher un rendez-vous de priorité basse à échanger
        exchange_date, exchange_time = find_and_exchange_low_priority_appointment(current_datetime, medecin)
        
        if exchange_date and exchange_time:
            # Vérifier si le créneau est vraiment disponible
            existing_rdv = RendezVous.objects.filter(
                medecin=medecin.user,
                date=exchange_date,
                heure=exchange_time
            ).first()
            
            if existing_rdv:
                return Response({
                    'error': f'Le créneau {exchange_time} le {exchange_date} est déjà occupé par le rendez-vous ID {existing_rdv.id}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Créer le rendez-vous d'urgence dans le créneau libéré
            new_rdv = RendezVous.objects.create(
                medecin=medecin.user,
                patient_id=patient_id,
                date=exchange_date,
                heure=exchange_time,
                priorite=priority,
                type_consultation=type_consultation,
                statut='en_attente'  # Le rendez-vous est initialement en attente
            )
            
            # Créer une notification urgente pour la réception
            patient_user = User.objects.get(id=patient_id)
            message_notif = f"🚨 RENDEZ-VOUS URGENT - Patient: {patient_user.first_name} {patient_user.last_name} - Dr. {medecin.user.first_name} {medecin.user.last_name} - {exchange_date} à {exchange_time}"
            NotificationUrgente.objects.create(
                rendezvous=new_rdv,
                message=message_notif
            )

            # Sérialiser le nouveau rendez-vous
            serializer = RendezVousListSerializer(new_rdv)
            
            return Response({
                'success': True,
                "message": "Rendez-vous d'urgence créé avec succès en remplaçant un rendez-vous de priorité basse",
                'rendezvous': serializer.data
            })
        
        # Si aucun créneau n'est disponible et aucun rendez-vous à échanger, retourner une erreur
        return Response({
            'error': "Aucun créneau disponible aujourd'hui et aucun rendez-vous de priorité basse à échanger"
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({
            'error': f"Erreur lors de la création du rendez-vous d'urgence: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        delay_days = int(request.data.get('delay_days', 0))  # Délai en jours avant le premier rendez-vous possible

        # Vérifier que l'utilisateur est bien le patient connecté
        if str(request.user.id) != str(patient_id):
            return Response({
                'error': 'Vous ne pouvez créer que vos propres rendez-vous'
            }, status=status.HTTP_403_FORBIDDEN)

        # Utiliser directement l'utilisateur connecté comme patient
        patient = request.user

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
            fin_heure = getattr(medecin, fin_field, time(23, 59))

            # Convertir les heures en minutes pour faciliter les calculs
            debut_minutes = debut_heure.hour * 60 + debut_heure.minute
            fin_minutes = fin_heure.hour * 60 + fin_heure.minute

            # Créer une liste de créneaux possibles en fonction des heures de travail
            possible_hours = []
            current_minutes = debut_minutes
            # Utiliser la durée de consultation du médecin (en minutes)
            duree_consultation = getattr(medecin, 'duree_consultation', 60)  # Par défaut 60 minutes
            while current_minutes < fin_minutes:
                hour = current_minutes // 60
                minute = current_minutes % 60
                possible_hours.append(f"{hour:02d}:{minute:02d}")
                current_minutes += duree_consultation  # Utiliser la durée de consultation du médecin

            # Récupérer les heures déjà prises pour ce jour (tous les rendez-vous sauf annulés)
            existing_hours = RendezVous.objects.filter(
                medecin=medecin.user,
                date=date_obj
            ).exclude(statut='annule').values_list('heure', flat=True)
            
            # Log pour débogage
            print(f"DEBUG: possible_hours pour {date_obj}: {possible_hours}")
            print(f"DEBUG: existing_hours pour {date_obj}: {list(existing_hours)}")

            # Convertir les heures existantes en chaînes pour la comparaison
            existing_hours_str = [h.strftime('%H:%M') if hasattr(h, 'strftime') else str(h) for h in existing_hours]
            # Retourner les créneaux disponibles (ceux qui ne sont pas pris)
            available_slots = [hour for hour in possible_hours if hour not in existing_hours_str]
            print(f"DEBUG: available_slots pour {date_obj}: {available_slots}")
            return available_slots

        # ÉTAPE 1: Chercher d'abord un créneau disponible uniquement dans la journée actuelle
        current_date = datetime.now().date()

        # Appliquer le déai de jours si spécifié
        if delay_days > 0:
            current_date = current_date + timedelta(days=delay_days)

        # Chercher le premier jour où le médecin travaille (à partir de la date calculée)
        search_date = current_date
        max_search_days = 7  # Chercher dans les 7 jours suivants
        found_working_day = False

        for day_offset in range(max_search_days):
            search_date = current_date + timedelta(days=day_offset)

            # Vérifier si le médecin travaille ce jour
            if is_medecin_working_day(search_date, medecin):
                found_working_day = True
                break

        if found_working_day:
            # Récupérer les créneaux disponibles pour ce jour
            available_slots = get_available_slots(search_date, medecin)

            if available_slots:
        # Vérifier tous les créneaux disponibles un par un
                for slot_time in available_slots:
            # Vérifier une dernière fois que le créneau est toujours disponible
                    slot_already_taken = RendezVous.objects.filter(
                        medecin_id=medecin_id,
                        date=search_date,
                        heure=slot_time,
                        statut__in=['confirme', 'en_attente']
                    ).exists()

            if not slot_already_taken:
            # Créer directement le rendez-vous dans ce créneau disponible
                new_rdv = RendezVous.objects.create(
                    medecin_id=medecin_id,
                    patient_id=patient_id,
                    date=search_date,
                    heure=slot_time,
                    priorite=priority,
                    type_consultation=type_consultation,
                    statut='en_attente'  # Le rendez-vous est initialement en attente
                )

            # Sérialiser le nouveau rendez-vous
                serializer = RendezVousListSerializer(new_rdv)

                return Response({
                    'success': True,
                    "message": "Rendez-vous créé avec succès dans un créneau disponible",
                    'rendezvous': serializer.data
                })

            else:
                # Aucun créneau disponible ce jour-là, déplacer un rendez-vous de priorité basse
                # Chercher un rendez-vous de priorité basse à déplacer
                exchangeable_rdv = RendezVous.objects.filter(
                    medecin_id=medecin_id,
                    date=search_date,
                    priorite='basse',
                    statut__in=['confirme', 'en_attente']
                ).order_by('heure').first()

                if exchangeable_rdv:
                    # Sauvegarder l'heure originale du rendez-vous avant de le déplacer
                    original_heure = exchangeable_rdv.heure

                    # Chercher un nouveau créneau pour ce rendez-vous dans les 7 jours suivants
                    new_date_for_exchangeable = None
                    new_heure_for_exchangeable = None

                    for day_offset in range(1, 8):  # Chercher dans les 7 jours suivants
                        new_search_date = search_date + timedelta(days=day_offset)

                        # Vérifier si le médecin travaille ce jour
                        if not is_medecin_working_day(new_search_date, medecin):
                            continue

                        # Récupérer les créneaux disponibles pour cette date
                        new_available_slots = get_available_slots(new_search_date, medecin)

                        if new_available_slots:
                            # Utiliser le premier créneau disponible
                            new_date_for_exchangeable = new_search_date
                            new_heure_for_exchangeable = new_available_slots[0]
                            break

                    if new_date_for_exchangeable and new_heure_for_exchangeable:
                        # Déplacer le rendez-vous de priorité basse
                        exchangeable_rdv.date = new_date_for_exchangeable
                        exchangeable_rdv.heure = new_heure_for_exchangeable
                        exchangeable_rdv.save()

                        # Récupérer les créneaux disponibles pour le jour du rendez-vous original
                        available_slots_for_original_date = get_available_slots(search_date, medecin)
                        print(f"DEBUG - available_slots_for_original_date: {available_slots_for_original_date}")
                        print(f"DEBUG - original_heure: {original_heure}")
                        print(f"DEBUG - original_heure type: {type(original_heure)}")

                        if not available_slots_for_original_date:
                            return Response({
                                'error': "Aucun créneau disponible pour le jour du rendez-vous original"
                            }, status=status.HTTP_404_NOT_FOUND)

                        # Vérifier si l'heure originale est toujours disponible
                        new_heure_for_patient = None
                        # Convertir original_heure en chaîne pour la comparaison
                        original_heure_str = original_heure.strftime('%H:%M') if hasattr(original_heure, 'strftime') else str(original_heure)
                        if original_heure_str in available_slots_for_original_date:
                            new_heure_for_patient = original_heure_str
                            print(f"DEBUG - Utilisation de l'heure originale: {new_heure_for_patient}")
                        else:
                            # Utiliser le premier créneau disponible pour le jour du rendez-vous original
                            new_heure_for_patient = available_slots_for_original_date[0]
                            print(f"DEBUG - Utilisation du premier créneau disponible: {new_heure_for_patient}")

                        # Vérifier une dernière fois que le créneau est toujours disponible
                        slot_already_taken = RendezVous.objects.filter(
                            medecin_id=medecin_id,
                            date=search_date,
                            heure=new_heure_for_patient,
                            statut__in=['confirme', 'en_attente']
                        ).exists()

                        if slot_already_taken:
                            return Response({
                                'error': "Le créneau sélectionné n'est plus disponible"
                            }, status=status.HTTP_404_NOT_FOUND)

                        # Créer un nouveau rendez-vous pour le patient connecté dans le créneau disponible
                        new_rdv = RendezVous.objects.create(
                            medecin_id=medecin_id,
                            patient_id=patient_id,
                            date=search_date,
                            heure=new_heure_for_patient,
                            priorite=priority,
                            type_consultation=type_consultation,
                            statut='en_attente'
                        )

                        # Sérialiser le nouveau rendez-vous
                        serializer = RendezVousListSerializer(new_rdv)

                        return Response({
                            'success': True,
                            "message": "Rendez-vous créé avec succès en déplacant un rendez-vous de priorité basse",
                            'rendezvous': serializer.data
                        })

        # ÉTAPE 2: Si aucun créneau disponible dans le jour actuel, chercher un rendez-vous de priorité basse à déplacer
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
        ).exclude(patient_id=patient_id).order_by('date', 'heure')

        if not rendezvous_list.exists():
            return Response({
                'error': 'Aucun rendez-vous échangeable trouvé'
            }, status=status.HTTP_404_NOT_FOUND)

        # Trouver le premier rendez-vous échangeable
        exchangeable_rdv = rendezvous_list.first()

        # Sauvegarder l'heure originale du rendez-vous avant de le déplacer
        original_heure = exchangeable_rdv.heure
        original_date = exchangeable_rdv.date

        # Trouver un nouveau créneau pour le patient dont le rendez-vous va être déplacé
        # en commençant par le lendemain du rendez-vous échangeable
        search_date = original_date + timedelta(days=1)
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
                # Chercher un créneau disponible qui n'est pas 8:00
                found_non_8am = False
                for slot_time in available_slots:
                    if slot_time != '08:00':
                        new_date_for_exchangeable = search_date
                        new_heure_for_exchangeable = slot_time
                        found_non_8am = True
                        break

                # Si on n'a pas trouvé de créneau autre que 8:00, utiliser le premier créneau disponible
                if not found_non_8am and available_slots:
                    new_date_for_exchangeable = search_date
                    new_heure_for_exchangeable = available_slots[0]

                # Si on a trouvé un créneau, arrêter la recherche
                if new_date_for_exchangeable and new_heure_for_exchangeable:
                    break

            # Passer au jour suivant
            search_date = search_date + timedelta(days=1)

        if not new_date_for_exchangeable:
            return Response({
                'error': 'Impossible de trouver un créneau disponible pour déplacer le rendez-vous existant'
            }, status=status.HTTP_404_NOT_FOUND)

        # Déplacer le rendez-vous échangeable vers le nouveau créneau
        exchangeable_rdv.date = new_date_for_exchangeable
        exchangeable_rdv.heure = new_heure_for_exchangeable
        exchangeable_rdv.save()

        # Vérifier que l'heure originale est dans les créneaux de travail du médecin pour ce jour-là
        weekday = original_date.weekday()
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
        fin_heure = getattr(medecin, fin_field, time(23, 59))

        # Convertir l'heure originale en objet time
        if isinstance(original_heure, str):
            original_hour, original_minute = map(int, original_heure.split(':'))
            original_time = time(original_hour, original_minute)
        elif isinstance(original_heure, time):
            original_time = original_heure
        else:
            return Response({
                'error': "Format de l'heure originale invalide"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Récupérer les créneaux disponibles pour le jour du rendez-vous original
        available_slots_for_original_date = get_available_slots(original_date, medecin)

        if not available_slots_for_original_date:
            return Response({
                'error': "Aucun créneau disponible pour le jour du rendez-vous original"
            }, status=status.HTTP_404_NOT_FOUND)

        # Vérifier si l'heure originale est toujours disponible
        new_heure_for_patient = None
        if original_heure in available_slots_for_original_date:
            new_heure_for_patient = original_heure
        else:
            # Utiliser le premier créneau disponible pour le jour du rendez-vous original
            new_heure_for_patient = available_slots_for_original_date[0]

        # Vérifier une dernière fois que le créneau est toujours disponible
        slot_already_taken = RendezVous.objects.filter(
            medecin_id=medecin_id,
            date=original_date,
            heure=new_heure_for_patient,
            statut__in=['confirme', 'en_attente']
        ).exists()

        if slot_already_taken:
            return Response({
                'error': "Le créneau sélectionné n'est plus disponible"
            }, status=status.HTTP_404_NOT_FOUND)

        # Créer un nouveau rendez-vous pour le patient connecté dans le créneau disponible
        new_rdv = RendezVous.objects.create(
            medecin_id=medecin_id,
            patient_id=patient_id,
            date=original_date,
            heure=new_heure_for_patient,
            priorite=priority,
            type_consultation=type_consultation,
            statut='en_attente'  # Le rendez-vous est initialement en attente
        )

        # Sérialiser le nouveau rendez-vous
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications_urgentes(request):
    """
    Récupérer les notifications urgentes non acquittées pour la réception
    """
    user = request.user

    # Seuls la réception et l'admin peuvent voir les notifications urgentes
    if not (user.is_admin or user.is_reception):
        return Response({
            'error': 'Vous n\'avez pas la permission de voir ces notifications'
        }, status=status.HTTP_403_FORBIDDEN)

    notifications = NotificationUrgente.objects.filter(acquitte=False).order_by('-cree_le')
    serializer = NotificationUrgenteSerializer(notifications, many=True)

    # Compter les notifications non lues
    count_non_lues = NotificationUrgente.objects.filter(lu=False).count()
    count_non_acquittées = NotificationUrgente.objects.filter(acquitte=False).count()

    return Response({
        'notifications': serializer.data,
        'count_non_lues': count_non_lues,
        'count_non_acquitees': count_non_acquittées
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_lue(request, pk):
    """
    Marquer une notification comme lue
    """
    try:
        notification = NotificationUrgente.objects.get(pk=pk)
        notification.lu = True
        notification.save()
        serializer = NotificationUrgenteSerializer(notification)
        return Response(serializer.data)
    except NotificationUrgente.DoesNotExist:
        return Response({'error': 'Notification non trouvée'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def acquitter_notification(request, pk):
    """
    Acquitter une notification urgente (arrêter le clignotement)
    """
    try:
        notification = NotificationUrgente.objects.get(pk=pk)
        notification.acquitte = True
        notification.lu = True
        notification.save()
        serializer = NotificationUrgenteSerializer(notification)
        return Response({
            'success': True,
            'message': 'Notification acquittée',
            'notification': serializer.data
        })
    except NotificationUrgente.DoesNotExist:
        return Response({'error': 'Notification non trouvée'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def acquitter_all_notifications(request):
    """
    Acquitter toutes les notifications urgentes
    """
    NotificationUrgente.objects.filter(acquitte=False).update(acquitte=True, lu=True)
    return Response({
        'success': True,
        'message': 'Toutes les notifications ont été acquittées'
    })







