from django.urls import path
from .views import (
    SpecialiteListView,
    SpecialiteDetailView,
    MedecinListView,
    MedecinDetailView,
    MedecinProfileView,
    MedecinPatientsListView
)

urlpatterns = [
    # Spécialités
    path('specialites/', SpecialiteListView.as_view(), name='specialite-list'),
    path('specialites/<int:pk>/', SpecialiteDetailView.as_view(), name='specialite-detail'),

    # Médecins
    path('', MedecinListView.as_view(), name='medecin-list'),
    path('<int:pk>/', MedecinDetailView.as_view(), name='medecin-detail'),
    path('profile/', MedecinProfileView.as_view(), name='medecin-profile'),
    path('patients/', MedecinPatientsListView.as_view(), name='medecin-patients'),
]
