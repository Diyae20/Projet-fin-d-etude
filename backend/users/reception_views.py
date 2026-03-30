from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
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
        # La réception peut voir tous les utilisateurs
        return User.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Ajouter les informations sur le médecin associé à chaque patient
        from rendezvous.models import RendezVous

        users_data = []
        for user in serializer.data:
            user_dict = dict(user)
            # Si l'utilisateur est un patient, récupérer le médecin associé via le dernier rendez-vous
            if user_dict['role'] == 'patient':
                # Récupérer le dernier rendez-vous du patient
                dernier_rdv = RendezVous.objects.filter(
                    patient_id=user_dict['id']
                ).order_by('-date', '-heure').first()

                if dernier_rdv:
                    medecin = User.objects.get(id=dernier_rdv.medecin_id)
                    user_dict['medecin'] = {
                        'id': medecin.id,
                        'first_name': medecin.first_name,
                        'last_name': medecin.last_name,
                        'email': medecin.email
                    }
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
            print(f"Données reçues pour la mise à jour: {request.data}")
            print(f"ID de l'utilisateur: {kwargs.get('pk')}")
            
            response = super().update(request, *args, **kwargs)
            print(f"Mise à jour réussie pour l'utilisateur {kwargs.get('pk')}")
            return response
        except Exception as e:
            print(f"Erreur lors de la mise à jour: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


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
        # Supprimer l'utilisateur associé
        instance.user.delete()


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reception_dashboard(request):
    """
    Vue pour le tableau de bord de la réception
    """
    if not request.user.is_reception and not request.user.is_admin:
        return Response(
            {'error': 'Accès non autorisé'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Statistiques pour le tableau de bord
    total_patients = User.objects.filter(role='patient').count()
    total_medecins = User.objects.filter(role='medecin').count()
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
