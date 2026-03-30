from django.urls import path
from .views import (
    RendezVousListView,
    RendezVousDetailView,
    get_medecin_rendezvous,
    get_patient_rendezvous,
    get_rendezvous_disponibles,
    get_medecin_disponibilite_par_jour
)

urlpatterns = [
    # Rendez-vous
    path('', RendezVousListView.as_view(), name='rendezvous-list'),
    path('<int:pk>/', RendezVousDetailView.as_view(), name='rendezvous-detail'),
    path('medecin/', get_medecin_rendezvous, name='medecin-rendezvous-current'),
    path('medecin/<int:medecin_id>/', get_medecin_rendezvous, name='medecin-rendezvous'),
    path('patient/<int:patient_id>/', get_patient_rendezvous, name='patient-rendezvous'),
    path('disponibles/', get_rendezvous_disponibles, name='rendezvous-disponibles'),
    path('disponibilite-par-jour/', get_medecin_disponibilite_par_jour, name='medecin-disponibilite-par-jour'),

]
