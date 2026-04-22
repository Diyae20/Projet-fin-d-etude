
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    ResetPasswordView,
    ChangePasswordView,
    DeleteAccountView
)

urlpatterns = [
    path('register/', csrf_exempt(UserRegistrationView.as_view()), name='user-register'),
    path('login/', csrf_exempt(UserLoginView.as_view()), name='user-login'),
    path('logout/', csrf_exempt(UserLogoutView.as_view()), name='user-logout'),
    path('reset-password/', csrf_exempt(ResetPasswordView.as_view()), name='reset-password'),
    path('change-password/', csrf_exempt(ChangePasswordView.as_view()), name='change-password'),
    path('delete-account/', csrf_exempt(DeleteAccountView.as_view()), name='delete-account'),
]
