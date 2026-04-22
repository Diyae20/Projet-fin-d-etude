from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import RendezVous
from .serializers import (
    RendezVousSerializer,
    RendezVousListSerializer
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
            return RendezVous.objects.filter(patient=user)
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

        if user.is_admin:
            return RendezVous.objects.all()
        elif user.is_medecin:
            return RendezVous.objects.filter(medecin=user)
        elif user.is_patient:
            return RendezVous.objects.filter(patient=user)
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
        Annuler un rendez-vous au lieu de le supprimer
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
    if not (user.is_admin or user.is_medecin):
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
    serializer = RendezVousListSerializer(rendezvous, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_rendezvous(request, patient_id):
    """
    Récupérer les rendez-vous d'un patient spécifique
    """
    user = request.user

    # Vérifier les permissions
    if not (user.is_admin or user.is_medecin):
        return Response({
            'error': 'Vous n\'avez pas la permission de voir ces rendez-vous'
        }, status=status.HTTP_403_FORBIDDEN)

    # Si c'est un patient, vérifier qu'il consulte ses propres rendez-vous
    if user.is_patient and user.id != int(patient_id):
        return Response({
            'error': 'Vous ne pouvez consulter que vos propres rendez-vous'
        }, status=status.HTTP_403_FORBIDDEN)

    # Récupérer les rendez-vous
    rendezvous = RendezVous.objects.filter(patient_id=patient_id)
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

    try:
        # Essayer d'abord de récupérer le profil du médecin avec l'ID fourni
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
        date=date_str,
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
                medecin_id=medecin_id,
                date=date_check.strftime('%Y-%m-%d'),
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
            'medecin_id': medecin_id,
            'date': date_str,
            'creneaux': [],
            'date_complete': True,
            'message': f'Désolé, le médecin a déjà atteint son maximum de {max_patients} patients pour cette date.',
            'prochaines_dates': prochaines_dates_disponibles
        })

    # Générer des créneaux horaires standards (8h-18h)
    creneaux_disponibles = []
    debut = datetime.strptime('08:00', '%H:%M').time()
    fin = datetime.strptime('18:00', '%H:%M').time()

    current = datetime.combine(datetime.min, debut)
    end_time = datetime.combine(datetime.min, fin)

    while current < end_time:
        heure = current.time()
        if heure not in rendezvous_pris:
            creneaux_disponibles.append({
                'heure': heure.strftime('%H:%M'),
                'disponible': True
            })
        current += timedelta(minutes=duree_consultation)

    return Response({
        'medecin_id': medecin_id,
        'date': date_str,
        'creneaux': creneaux_disponibles,
        'date_complete': False,
        'max_patients': max_patients,
        'patients_actuels': len(rendezvous_pris)
    })
