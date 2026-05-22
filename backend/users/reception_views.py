from rest_framework import generics, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.utils import timezone
import logging

# Créer un logger pour ce module
logger = logging.getLogger(__name__)
from .models import User
from .serializers import UserSerializer
from medecins.models import Medecin
from medecins.serializers import MedecinSerializer, MedecinListSerializer, MedecinDetailSerializer
from rendezvous.models import RendezVous
from rendezvous.serializers import RendezVousSerializer, RendezVousListSerializer


class ReceptionUserListView(generics.ListCreateAPIView):
    """
    Vue pour la liste et la création des utilisateurs (accessible par la réception)
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Récupérer le médecin associé à la réception connectée
        reception_user = self.request.user
        medecin_associe = reception_user.medecin

        if not medecin_associe:
            # Si la réception n'a pas de médecin associé, retourner une liste vide
            return User.objects.none()

        # La réception peut voir tous les utilisateurs associés à son médecin
        return User.objects.filter(
            visible_for_reception=True,
            medecin=medecin_associe
        )


class ReceptionPatientsWithRendezvousListView(generics.ListAPIView):
    """
    Vue pour lister tous les patients associés au médecin
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Récupérer le médecin associé à la réception connectée
        reception_user = self.request.user
        medecin_associe = reception_user.medecin

        if not medecin_associe:
            # Si la réception n'a pas de médecin associé, retourner une liste vide
            return User.objects.none()

        # Récupérer tous les patients associés à ce médecin
        return User.objects.filter(
            role='patient',
            visible_for_reception=True,
            medecin=medecin_associe
        ).select_related('medecin')

    def list(self, request, *args, **kwargs):
        # Récupérer tous les utilisateurs avec leur médecin associé préchargé
        queryset = self.get_queryset().select_related('medecin')
        print(f"Queryset: {queryset.query}")
        print(f"Nombre de patients: {queryset.count()}")
        
        # Vérifier les valeurs dans la base de données
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, first_name, last_name, visible_for_reception, medecin_id FROM users_user WHERE role = 'patient'")
            rows = cursor.fetchall()
            print(f"Patients dans la base de données:")
            for row in rows:
                print(f"  ID: {row[0]}, Nom: {row[1]} {row[2]}, visible_for_reception: {row[3]}, medecin_id: {row[4]}")
        
        for user in queryset:
            print(f"Patient {user.id}: {user.first_name} {user.last_name}, visible_for_reception={user.visible_for_reception}, medecin={user.medecin}")

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # La réception peut créer des utilisateurs avec n'importe quel rôle
        # Si l'utilisateur créé est une réception, l'associer au médecin de la réception connectée
        reception_user = self.request.user
        role = self.request.data.get('role', '')

        if role == 'reception' and reception_user.medecin:
            # Associer la nouvelle réception au même médecin que la réception connectée
            serializer.save(medecin=reception_user.medecin)
        elif role == 'patient' and reception_user.medecin:
            # Associer le patient au médecin de la réception connectée
            serializer.save(medecin=reception_user.medecin)
        else:
            serializer.save()


class ReceptionUserUpdateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la mise à jour des utilisateurs par la réception
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'date_of_birth', 'address', 'city',
            'photo', 'created_at', 'updated_at', 'password', 'is_active', 'visible_for_reception', 'medecin', 'code_unique'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'code_unique']

    def update(self, instance, validated_data):
        """
        Mettre à jour un utilisateur en gérant le champ medecin
        """
        print(f"Données validées: {validated_data}")
        print(f"État avant mise à jour - visible_for_reception: {instance.visible_for_reception}, medecin: {instance.medecin}")
        
        # Vérifier si le champ medecin a été fourni dans les données de mise à jour
        if 'medecin' in validated_data:
            medecin = validated_data.pop('medecin')
            print(f"Médecin: {medecin}")
            instance.medecin = medecin
            print(f"Médecin mis à jour: {instance.medecin}")

        # Mettre à jour les autres champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            print(f"Champ {attr} mis à jour: {value}")

        # Sauvegarder les modifications
        print(f"État avant sauvegarde - visible_for_reception: {instance.visible_for_reception}, medecin: {instance.medecin}")
        print(f"Appel de la méthode save()")
        print(f"ID de l'instance: {instance.id}")
        print(f"Type de l'instance: {type(instance)}")
        print(f"Méthode save de l'instance: {instance.save}")
        
        # Vérifier l'état de la transaction
        from django.db import transaction
        print(f"État de la transaction avant save: {transaction.get_autocommit()}")
        
        instance.save()
        
        print(f"État de la transaction après save: {transaction.get_autocommit()}")
        print(f"Méthode save() terminée")
        print(f"Utilisateur {instance.id} mis à jour avec succès")
        print(f"État après sauvegarde - visible_for_reception: {instance.visible_for_reception}, medecin: {instance.medecin}")
        
        # Vérifier que les modifications ont été sauvegardées dans la base de données
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT visible_for_reception, medecin_id FROM users_user WHERE id = %s", [instance.id])
            row = cursor.fetchone()
            print(f"Valeurs dans la base de données - visible_for_reception: {row[0]}, medecin_id: {row[1]}")
        
        # Vérifier si le cache est activé
        from django.core.cache import cache
        print(f"Cache activé: {cache is not None}")
        
        # Vider le cache
        cache.clear()
        print("Cache vidé")
        
        # Vérifier à nouveau les valeurs dans la base de données après avoir vidé le cache
        with connection.cursor() as cursor:
            cursor.execute("SELECT visible_for_reception, medecin_id FROM users_user WHERE id = %s", [instance.id])
            row = cursor.fetchone()
            print(f"Valeurs dans la base de données après vidage du cache - visible_for_reception: {row[0]}, medecin_id: {row[1]}")
        
        # Vérifier si les modifications sont bien sauvegardées dans la base de données
        # en rechargeant l'instance depuis la base de données
        from users.models import User
        reloaded_user = User.objects.get(id=instance.id)
        print(f"Valeurs après rechargement depuis la base de données - visible_for_reception: {reloaded_user.visible_for_reception}, medecin: {reloaded_user.medecin}")

        return instance


class ReceptionUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour les détails d'un utilisateur (accessible par la réception)
    """
    serializer_class = ReceptionUserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Récupérer le médecin associé à la réception connectée
        reception_user = self.request.user
        medecin_associe = reception_user.medecin

        if not medecin_associe:
            # Si la réception n'a pas de médecin associé, retourner une liste vide
            return User.objects.none()

        # Pour la mise à jour, la réception peut accéder aux utilisateurs associés à son médecin
        # même s'ils ne sont plus visibles (pour permettre de les désactiver)
        return User.objects.all()

    def update(self, request, *args, **kwargs):
        try:
            # Log des données reçues
            logger.info(f"Données reçues pour la mise à jour: {request.data}")
            logger.info(f"ID de l'utilisateur: {kwargs.get('pk')}")
            
            # Vérifier si le patient est en train d'être réactivé ou désactivé
            user = self.get_object()
            is_reactivating = not user.visible_for_reception and request.data.get('visible_for_reception', True)
            is_deactivating = user.visible_for_reception and not request.data.get('visible_for_reception', True)
            
            response = super().update(request, *args, **kwargs)
            logger.info(f"Mise à jour réussie pour l'utilisateur {kwargs.get('pk')}")
            user = self.get_object()

            
            # Si le patient est réactivé ou désactivé, réinitialiser son nombre de rendez-vous
            if is_reactivating or is_deactivating:
                # Réinitialiser le nombre total de rendez-vous
                print(f"Réinitialisation du nombre de rendez-vous pour le patient {user.id}")
                print(f"État avant réinitialisation - visible_for_reception: {user.visible_for_reception}, medecin: {user.medecin}")
                user.total_rendezvous_count = 0
                user.save()
                print(f"État après réinitialisation - visible_for_reception: {user.visible_for_reception}, medecin: {user.medecin}")
                
                # Si le patient est réactivé, supprimer toutes les notes du médecin pour ce patient
                if is_reactivating:
                    from rendezvous.models import NotePatient
                    NotePatient.objects.filter(patient=user).delete()
                    logger.info(f"Réinitialisation du patient {user.id}: nombre de rendez-vous et notes supprimées")
                else:
                    logger.info(f"Désactivation du patient {user.id}: nombre de rendez-vous réinitialisé")
            
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
        # Récupérer le médecin associé à la réception connectée
        reception_user = self.request.user
        medecin_associe = reception_user.medecin

        if not medecin_associe:
            # Si la réception n'a pas de médecin associé, retourner une liste vide
            return []

        # Créer une liste contenant uniquement le profil du médecin associé
        medecin_profiles = []
        try:
            medecin_profile = Medecin.objects.get(user=medecin_associe)
            medecin_profiles.append(medecin_profile)
        except Medecin.DoesNotExist:
            # Créer un profil médecin avec des valeurs par défaut s'il n'existe pas
            medecin_profile = Medecin.objects.create(
                user=medecin_associe,
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
        # Récupérer le médecin associé à la réception connectée
        reception_user = self.request.user
        medecin_associe = reception_user.medecin

        if not medecin_associe:
            # Si la réception n'a pas de médecin associé, retourner une erreur 404
            raise Http404("Aucun médecin associé à cette réception")

        # Vérifier que l'ID demandé correspond au médecin associé
        medecin_id = self.kwargs['pk']
        try:
            medecin_profile = Medecin.objects.get(id=medecin_id, user=medecin_associe)
            return medecin_profile
        except Medecin.DoesNotExist:
            raise Http404("Médecin non trouvé")
    
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
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return RendezVousListSerializer
        return RendezVousSerializer

    def get_queryset(self):
        # Récupérer le médecin associé à la réception connectée
        reception_user = self.request.user
        medecin_associe = reception_user.medecin

        if not medecin_associe:
            # Si la réception n'a pas de médecin associé, retourner une liste vide
            return RendezVous.objects.none()

        # Filtrer les rendez-vous pour ne retourner que ceux du médecin associé
        return RendezVous.objects.filter(medecin=medecin_associe).select_related('patient', 'medecin')


class ReceptionRendezvousDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour les détails d'un rendez-vous (accessible par la réception)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Récupérer le médecin associé à la réception connectée
        reception_user = self.request.user
        medecin_associe = reception_user.medecin

        if not medecin_associe:
            # Si la réception n'a pas de médecin associé, retourner une liste vide
            return RendezVous.objects.none()

        # Filtrer les rendez-vous pour ne retourner que ceux du médecin associé
        return RendezVous.objects.filter(medecin=medecin_associe).select_related('patient', 'medecin')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return RendezVousListSerializer
        return RendezVousSerializer

    def perform_update(self, serializer):
        """
        Permettre à la réception de mettre à jour tous les champs du rendez-vous
        """
        try:
            serializer.save()
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du rendez-vous: {str(e)}")
            raise ValidationError({'detail': str(e)})
    def perform_destroy(self, instance):
        """
        Supprimer un rendez-vous sans supprimer le patient associé
        """
        try:
            # Supprimer le rendez-vous
            instance.delete()
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du rendez-vous: {str(e)}")
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
    # Récupérer le médecin associé à la réception connectée
    medecin_associe = request.user.medecin
    
    if medecin_associe:
        # Compter uniquement les patients qui ont au moins un rendez-vous avec ce médecin
        patient_ids = RendezVous.objects.filter(
            patient_id__isnull=False,
            medecin=medecin_associe
        ).values_list('patient_id', flat=True).distinct()
        total_patients = User.objects.filter(
            id__in=patient_ids,
            role='patient',
            visible_for_reception=True
        ).count()
    else:
        # Si la réception n'a pas de médecin associé, le nombre de patients est 0
        total_patients = 0
    total_medecins = User.objects.filter(role='medecin', visible_for_reception=True).count()
    # Exclure les rendez-vous avec le statut "passe" du total
    total_rendezvous = RendezVous.objects.exclude(statut='passe').count()
    rendezvous_en_attente = RendezVous.objects.filter(statut='en_attente').count()
    rendezvous_confirmes = RendezVous.objects.filter(statut='confirme').count()
    rendezvous_annules = RendezVous.objects.filter(statut='annule').count()
    # Ne pas compter les rendez-vous avec le statut "passe"
    rendezvous_passe = 0
    rendezvous_aujourdhui = RendezVous.objects.filter(
        date=timezone.now().date()
    ).exclude(statut='passe').count()

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
