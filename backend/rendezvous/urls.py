from django.urls import path
from .views import priority_booking, emergency_booking
from .views import (
    RendezVousListView,
    RendezVousDetailView,
    exchange_rendezvous,
    get_medecin_rendezvous,
    get_medecin_rendezvous_public,
    get_patient_rendezvous,
    get_all_patient_rendezvous,
    get_rendezvous_disponibles,
    get_medecin_disponibilite_par_jour,
    get_rendezvous_medecin_date,
    NotePatientListCreateView,
    NotePatientDetailView,
    update_rendezvous_datetime,
    notify_rendezvous_changed,
    get_notifications_urgentes,
    mark_notification_lue,
    acquitter_notification,
    acquitter_all_notifications
)

urlpatterns = [
    # Rendez-vous
    path('', RendezVousListView.as_view(), name='rendezvous-list'),
    path('<int:pk>/', RendezVousDetailView.as_view(), name='rendezvous-detail'),
    path('<int:pk>/update-datetime/', update_rendezvous_datetime, name='rendezvous-update-datetime'),
    path('<int:pk>/notify-change/', notify_rendezvous_changed, name='rendezvous-notify-change'),
    path('medecin/<int:medecin_id>/date/<str:date>/', get_rendezvous_medecin_date, name='rendezvous-medecin-date'),
    path('medecin/', get_medecin_rendezvous, name='medecin-rendezvous-current'),
    path('medecin/<int:medecin_id>/', get_medecin_rendezvous, name='medecin-rendezvous'),
    path('medecin/<int:medecin_id>/public/', get_medecin_rendezvous_public, name='medecin-rendezvous-public'),
    path('patient/<int:patient_id>/', get_patient_rendezvous, name='patient-rendezvous'),
    path('patient/all/', get_all_patient_rendezvous, name='all-patient-rendezvous'),
    path('priority-booking/', priority_booking, name='rendezvous-priority-booking'),
    path('emergency-booking/', emergency_booking, name='rendezvous-emergency-booking'),
    path('disponibles/', get_rendezvous_disponibles, name='rendezvous-disponibles'),
    path('disponibilite-par-jour/', get_medecin_disponibilite_par_jour, name='medecin-disponibilite-par-jour'),
    path('exchange/', exchange_rendezvous, name='rendezvous-exchange'),

    # Notes de patients
    path('notes/', NotePatientListCreateView.as_view(), name='note-patient-list'),
    path('notes/<int:pk>/', NotePatientDetailView.as_view(), name='note-patient-detail'),

    # Notifications urgentes
    path('notifications/urgentes/', get_notifications_urgentes, name='notifications-urgentes'),
    path('notifications/urgentes/acquitter-all/', acquitter_all_notifications, name='notifications-acquitter-all'),
    path('notifications/urgentes/<int:pk>/lue/', mark_notification_lue, name='notification-lue'),
    path('notifications/urgentes/<int:pk>/acquitter/', acquitter_notification, name='notification-acquitter'),
]
