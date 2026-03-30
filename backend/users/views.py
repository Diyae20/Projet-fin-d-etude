from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import User
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    UserLoginSerializer
)


@method_decorator(csrf_exempt, name='dispatch')
class UserRegistrationView(generics.CreateAPIView):
    """
    Vue pour l'inscription d'un nouvel utilisateur
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer


@method_decorator(csrf_exempt, name='dispatch')
class UserLoginView(generics.GenericAPIView):
    """
    Vue pour la connexion d'un utilisateur
    """
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(request, username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key,
                'message': 'Connexion réussie'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Nom d\'utilisateur ou mot de passe incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)


@method_decorator(csrf_exempt, name='dispatch')
class UserLogoutView(generics.GenericAPIView):
    """
    Vue pour la déconnexion d'un utilisateur
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # Supprimer le token d'authentification
            request.user.auth_token.delete()
            return Response({
                'message': 'Déconnexion réussie'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Une erreur est survenue lors de la déconnexion'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Vue pour consulter et mettre à jour le profil de l'utilisateur connecté
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """
    Vue pour lister les utilisateurs (réservée aux administrateurs)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Seuls les administrateurs peuvent voir tous les utilisateurs
        if self.request.user.is_admin:
            return User.objects.all()
        # Les médecins peuvent voir les patients
        elif self.request.user.is_medecin:
            return User.objects.filter(role='patient')
        # Les patients ne peuvent voir que leur propre profil
        else:
            return User.objects.filter(id=self.request.user.id)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour consulter, mettre à jour ou supprimer un utilisateur spécifique
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Seuls les administrateurs peuvent voir tous les utilisateurs
        if self.request.user.is_admin:
            return User.objects.all()
        # Les médecins peuvent voir les patients
        elif self.request.user.is_medecin:
            return User.objects.filter(role='patient')
        # Les patients ne peuvent voir que leur propre profil
        else:
            return User.objects.filter(id=self.request.user.id)


class ChangePasswordView(generics.GenericAPIView):
    """
    Vue pour changer le mot de passe de l'utilisateur connecté
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        # Vérifier que tous les champs sont fournis
        if not old_password or not new_password or not confirm_password:
            return Response({
                'error': 'Veuillez fournir tous les champs requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'ancien mot de passe est correct
        if not user.check_password(old_password):
            return Response({
                'error': 'L\'ancien mot de passe est incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que les nouveaux mots de passe correspondent
        if new_password != confirm_password:
            return Response({
                'error': 'Les nouveaux mots de passe ne correspondent pas'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Changer le mot de passe
        user.set_password(new_password)
        user.save()

        return Response({
            'message': 'Mot de passe changé avec succès'
        }, status=status.HTTP_200_OK)


class DeleteAccountView(generics.GenericAPIView):
    """
    Vue pour supprimer le compte de l'utilisateur connecté
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        password = request.data.get('password')

        # Vérifier que le mot de passe est fourni
        if not password:
            return Response({
                'error': 'Veuillez fournir votre mot de passe pour confirmer la suppression'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que le mot de passe est correct
        if not user.check_password(password):
            return Response({
                'error': 'Mot de passe incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Supprimer le token d'authentification
        try:
            user.auth_token.delete()
        except:
            pass

        # Supprimer l'utilisateur
        username = user.username
        user.delete()

        return Response({
            'message': f'Le compte {username} a été supprimé avec succès'
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordView(generics.GenericAPIView):
    """
    Vue pour réinitialiser le mot de passe d'un utilisateur via son email
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        new_password = request.data.get('new_password')

        # Vérifier que tous les champs sont fournis
        if not email or not new_password:
            return Response({
                'error': 'Veuillez fournir tous les champs requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'email existe
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Cet email n\'existe pas. Veuillez vous inscrire.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Vérifier la longueur du mot de passe
        if len(new_password) < 8:
            return Response({
                'error': 'Le mot de passe doit contenir au moins 8 caractères.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Changer le mot de passe
        user.set_password(new_password)
        user.save()

        return Response({
            'message': 'Mot de passe réinitialisé avec succès'
        }, status=status.HTTP_200_OK)
