
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime, timedelta, time
from .models import RendezVous, NotePatient
from .serializers import (
    RendezVousSerializer,
    RendezVousListSerializer,
    NotePatientSerializer
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
            return RendezVous.objects.filter(patient=user).exclude(statut='annulé')
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

        # Incrémenter le nombre total de rendez-vous du médecin
        if result.medecin:
            result.medecin.total_rendezvous_count += 1
            result.medecin.save()

        print(f"Rendez-vous créé: {result}")
        return result
