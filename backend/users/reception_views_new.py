from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
import logging

# Créer un logger pour ce module
logger = logging.getLogger(__name__)
from .models import User
from .serializers import UserSerializer
from medecins.models import Medecin
from medecins.serializers import MedecinSerializer, MedecinListSerializer, MedecinDetailSerializer
from rendezvous.models import RendezVous
from rendezvous.serializers import RendezVousSerializer


class ReceptionUserListView(generics.ListCreateAPIView):
    """
    Vue pour la liste et la création des utilisateurs (accessible par la réception)
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # La réception peut voir tous les utilisateurs actifs
        return User.objects.filter(visible_for_reception=True)

    def list(self, request, *args, **kwargs):
        # Récupérer tous les utilisateurs avec leurs rendez-vous préchargés
        queryset = self.get_queryset()

        # Précharger les rendez-vous pour tous les utilisateurs en une seule requête
        queryset = queryset.prefetch_related(
            'rendezvous_patient'
        )

        serializer = self.get_serializer(queryset, many=True)

        # Ajouter les informations sur le médecin associé à chaque patient
        users_data = []
        for user, user_data in zip(queryset, serializer.data):
            user_dict = dict(user_data)
            # Si l'utilisateur est un patient, récupérer le médecin associé via le dernier rendez-vous
            if user_dict['role'] == 'patient':
                # Récupérer le dernier rendez-vous du patient depuis les données préchargées
                rendezvous_list = list(user.rendezvous_patient.all())
                if rendezvous_list:
                    # Trier les rendez-vous en mémoire pour trouver le plus récent
                    dernier_rdv = max(rendezvous_list, key=lambda x: (x.date, x.heure))
                    if dernier_rdv.medecin:
                        user_dict['medecin'] = {
                            'id': dernier_rdv.medecin.id,
                            'first_name': dernier_rdv.medecin.first_name,
                            'last_name': dernier_rdv.medecin.last_name,
                            'email': dernier_rdv.medecin.email
                        }
                    else:
                        user_dict['medecin'] = None
                else:
                    user_dict['medecin'] = None
            else:
                user_dict['medecin'] = None

            users_data.append(user_dict)

        return Response(users_data)

    def perform_create(self, serializer):
        # La réception peut créer des utilisateurs avec n'importe quel rôle
        serializer.save()


class ReceptionUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour les détails d'un utilisateur (accessible par la réception)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        try:
            # Log des données reçues
            logger.info(f"Données reçues pour la mise à jour: {request.data}")
            logger.info(f"ID de l'utilisateur: {kwargs.get('pk')}")

            # Récupérer l'objet utilisateur
            user = self.get_object()

            # Empêcher la modification du champ is_active
            if 'is_active' in request.data:
                request.data['is_active'] = user.is_active

            response = super().update(request, *args, **kwargs)
            logger.info(f"Mise à jour réussie pour l'utilisateur {kwargs.get('pk')}")
            return response
        except ValidationError as e:
            logger.warning(f"Erreur de validation lors de la mise à jour: {str(e)}")
            raise  # Laisser DRF gérer l'erreur
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour: {str(e)}")
            raise ValidationError({'detail': str(e)})


class ReceptionMedecinListView(generics.ListCreateAPIView):
    """
    Vue pour la liste et la création des médecins (accessible par la réception)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserSerializer
        return MedecinListSerializer

    def get_queryset(self):
        # Récupérer tous les utilisateurs avec le rôle médecin
        medecin_users = User.objects.filter(role='medecin')

        # Créer une liste de profils médecin, en créant automatiquement un profil s'il n'existe pas
        medecin_profiles = []
        for user in medecin_users:
            try:
                medecin_profile = Medecin.objects.get(user=user)
            except Medecin.DoesNotExist:
                # Créer un profil médecin avec des valeurs par défaut s'il n'existe pas
                medecin_profile = Medecin.objects.create(
                    user=user,
                    bio='',
                    adresse_cabinet='',
                    telephone='',
                    ville='',
                    duree_consultation=30,
                    max_patients_par_jour=10
                )
            medecin_profiles.append(medecin_profile)

        return medecin_profiles

    def perform_create(self, serializer):
        try:
            # Créer l'utilisateur avec le rôle médecin
            user = serializer.save(role='medecin')

            # Créer le profil médecin avec des valeurs par défaut
            Medecin.objects.create(
                user=user,
                bio='',
                adresse_cabinet='',
                telephone='',
                ville='',
                duree_consultation=30,
                max_patients_par_jour=10
            )
        except Exception as e:
            logger.error(f"Erreur lors de la création du médecin: {str(e)}")
            raise ValidationError({'detail': str(e)})


class ReceptionMedecinDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour les détails d'un médecin (accessible par la réception)
    """
    permission_classes = [IsAuthenticated]

    def get_object(self):
        medecin_id = self.kwargs['pk']
        return get_object_or_404(Medecin, id=medecin_id)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MedecinSerializer
        return MedecinDetailSerializer

    def perform_update(self, serializer):
        medecin = self.get_object()
        serializer.save()

    def perform_destroy(self, instance):
        try:
            # Supprimer l'utilisateur associé
            instance.user.delete()
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du médecin: {str(e)}")
            raise ValidationError({'detail': str(e)})


class ReceptionRendezvousListView(generics.ListCreateAPIView):
    """
    Vue pour la liste et la création des rendez-vous (accessible par la réception)
    """
    serializer_class = RendezVousSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RendezVous.objects.all().select_related('patient', 'medecin')


class ReceptionRendezvousDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour les détails d'un rendez-vous (accessible par la réception)
    """
    queryset = RendezVous.objects.all()
    serializer_class = RendezVousSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        """
        Permettre à la réception de mettre à jour tous les champs du rendez-vous
        """
        try:
            serializer.save()
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du rendez-vous: {str(e)}")
            raise ValidationError({'detail': str(e)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reception_dashboard(request):
    """
    Vue pour le tableau de bord de la réception
    """
    if not request.user.is_reception and not request.user.is_admin:
        logger.warning(f"Tentative d'accès non autorisé au tableau de bord par l'utilisateur {request.user.id}")
        raise PermissionDenied({'detail': 'Accès non autorisé'})

    # Statistiques pour le tableau de bord
    total_patients = User.objects.filter(role='patient', visible_for_reception=True).count()
    total_medecins = User.objects.filter(role='medecin', visible_for_reception=True).count()
    total_rendezvous = RendezVous.objects.count()
    rendezvous_en_attente = RendezVous.objects.filter(statut='en_attente').count()
    rendezvous_confirmes = RendezVous.objects.filter(statut='confirme').count()
    rendezvous_annules = RendezVous.objects.filter(statut='annule').count()
    rendezvous_passe = RendezVous.objects.filter(statut='passe').count()
    rendezvous_aujourdhui = RendezVous.objects.filter(
        date=timezone.now().date()
    ).count()

    return Response({
        'total_patients': total_patients,
        'total_medecins': total_medecins,
        'total_rendezvous': total_rendezvous,
        'rendezvous_en_attente': rendezvous_en_attente,
        'rendezvous_confirmes': rendezvous_confirmes,
        'rendezvous_annules': rendezvous_annules,
        'rendezvous_passe': rendezvous_passe,
        'rendezvous_aujourdhui': rendezvous_aujourdhui,
    })
