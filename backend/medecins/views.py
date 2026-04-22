from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Specialite, Medecin
from .serializers import (
    SpecialiteSerializer,
    MedecinSerializer,
    MedecinListSerializer,
    MedecinDetailSerializer
)


class SpecialiteListView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des spécialités
    """
    queryset = Specialite.objects.all()
    serializer_class = SpecialiteSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Tout le monde peut voir les spécialités, seul un admin peut en créer
        """
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """
        Seuls les administrateurs peuvent créer des spécialités
        """
        if not self.request.user.is_admin:
            return Response({
                'error': 'Vous n\'avez pas la permission de créer une spécialité'
            }, status=status.HTTP_403_FORBIDDEN)
        serializer.save()


class SpecialiteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour consulter, mettre à jour ou supprimer une spécialité
    """
    queryset = Specialite.objects.all()
    serializer_class = SpecialiteSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Tout le monde peut voir les spécialités, seul un admin peut les modifier
        """
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        """
        Seuls les administrateurs peuvent modifier des spécialités
        """
        if not self.request.user.is_admin:
            return Response({
                'error': 'Vous n\'avez pas la permission de modifier cette spécialité'
            }, status=status.HTTP_403_FORBIDDEN)
        serializer.save()

    def perform_destroy(self, instance):
        """
        Seuls les administrateurs peuvent supprimer des spécialités
        """
        if not self.request.user.is_admin:
            return Response({
                'error': 'Vous n\'avez pas la permission de supprimer cette spécialité'
            }, status=status.HTTP_403_FORBIDDEN)
        instance.delete()


class MedecinListView(generics.ListAPIView):
    """
    Vue pour lister les médecins avec filtres
    """
    queryset = Medecin.objects.select_related('user', 'specialite').all()
    serializer_class = MedecinListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['specialite', 'ville']
    search_fields = ['user__first_name', 'user__last_name', 'specialite__nom']


class MedecinDetailView(generics.RetrieveAPIView):
    """
    Vue pour consulter le profil d'un médecin
    """
    queryset = Medecin.objects.select_related('user', 'specialite').all()
    serializer_class = MedecinDetailSerializer
    permission_classes = [AllowAny]


class MedecinProfileView(generics.RetrieveUpdateAPIView):
    """
    Vue pour consulter et mettre à jour le profil du médecin connecté
    """
    serializer_class = MedecinSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Récupérer le profil médecin de l'utilisateur connecté
        """
        try:
            return Medecin.objects.get(user=self.request.user)
        except Medecin.DoesNotExist:
            # Si le profil n'existe pas, le créer
            return Medecin.objects.create(user=self.request.user)

    def perform_update(self, serializer):
        """
        Mettre à jour le profil médecin en gérant la spécialité et la photo de profil
        """
        specialite_id = self.request.data.get('specialite_id')
        specialite_nom = self.request.data.get('specialite_nom')
        remove_photo = self.request.data.get('remove_photo')

        # Gérer les suggestions_config
        suggestions_config = self.request.data.get('suggestions_config')
        if suggestions_config:
            # Si c'est une chaîne JSON, la convertir en objet
            if isinstance(suggestions_config, str):
                import json
                try:
                    suggestions_config = json.loads(suggestions_config)
                except json.JSONDecodeError:
                    pass
            serializer.instance.suggestions_config = suggestions_config

        # Si un nom de spécialité est fourni, essayer de trouver ou créer la spécialité
        if specialite_nom:
            try:
                specialite = Specialite.objects.get(nom__iexact=specialite_nom)
                serializer.instance.specialite = specialite
            except Specialite.DoesNotExist:
                # Créer une nouvelle spécialité si elle n'existe pas
                specialite = Specialite.objects.create(nom=specialite_nom)
                serializer.instance.specialite = specialite
        # Sinon, si un ID de spécialité est fourni, l'utiliser
        elif specialite_id:
            try:
                specialite = Specialite.objects.get(id=specialite_id)
                serializer.instance.specialite = specialite
            except Specialite.DoesNotExist:
                pass

        # Supprimer la photo si demandé
        if remove_photo == 'true' or remove_photo is True:
            serializer.instance.user.photo = None
            serializer.instance.user.save()

        serializer.save()
