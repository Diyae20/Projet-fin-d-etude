from django.urls import path
from .views import (
    UserProfileView,
    UserListView,
    UserDetailView,
    ChangePasswordView,
    DeleteAccountView
)
from .reception_views import (
    ReceptionUserListView,
    ReceptionUserDetailView,
    ReceptionMedecinListView,
    ReceptionMedecinDetailView,
    ReceptionRendezvousListView,
    ReceptionRendezvousDetailView,
    reception_dashboard
)

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    # Routes pour la réception
    path('reception/dashboard/', reception_dashboard, name='reception-dashboard'),
    path('reception/users/', ReceptionUserListView.as_view(), name='reception-user-list'),
    path('reception/users/<int:pk>/', ReceptionUserDetailView.as_view(), name='reception-user-detail'),
    path('reception/medecins/', ReceptionMedecinListView.as_view(), name='reception-medecin-list'),
    path('reception/medecins/<int:pk>/', ReceptionMedecinDetailView.as_view(), name='reception-medecin-detail'),
    path('reception/rendezvous/', ReceptionRendezvousListView.as_view(), name='reception-rendezvous-list'),
    path('reception/rendezvous/<int:pk>/', ReceptionRendezvousDetailView.as_view(), name='reception-rendezvous-detail'),
]
