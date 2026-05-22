from rest_framework import serializers
from .models import User
import random
import string

class UserSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle User
    """
    password = serializers.CharField(write_only=True, required=False)
    username = serializers.CharField(required=False)
    role = serializers.ChoiceField(
        choices=[('patient', 'Patient'), ('medecin', 'Médecin'), ('reception', 'Réception'), ('admin', 'Administrateur')],
        required=False
    )
    medecin = serializers.SerializerMethodField()
    rendezvous_count = serializers.IntegerField(source='total_rendezvous_count', read_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'date_of_birth', 'address', 'city',
            'photo', 'created_at', 'updated_at', 'password', 'is_active', 'visible_for_reception', 'medecin', 'rendezvous_count', 'code_unique'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'rendezvous_count', 'code_unique']

    def validate_role(self, value):
        """
        Valider que le rôle est valide
        """
        valid_roles = ['patient', 'medecin', 'reception', 'admin']
        if value and value not in valid_roles:
            raise serializers.ValidationError(f"Le rôle doit être l'une de ces valeurs: {', '.join(valid_roles)}")
        return value

    def get_medecin(self, obj):
        """
        Retourner les informations du médecin associé
        """
        if obj.medecin:
            return {
                'id': obj.medecin.id,
                'username': obj.medecin.username,
                'first_name': obj.medecin.first_name,
                'last_name': obj.medecin.last_name,
                'email': obj.medecin.email
            }
        return None

    def create(self, validated_data):
        """
        Créer un nouvel utilisateur
        """
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'inscription d'un nouvel utilisateur
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    code_medecin = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'date_of_birth', 'address', 'city',
            'password', 'password_confirm', 'code_medecin'
        ]

    def validate(self, attrs):
        """
        Vérifier que les mots de passe correspondent
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })

        # Si le rôle est réception, vérifier que le code_medecin est fourni
        if attrs.get('role') == 'reception' and not attrs.get('code_medecin'):
            raise serializers.ValidationError({
                "code_medecin": "Le code du médecin est requis pour s'inscrire en tant que réception."
            })

        return attrs

    def generate_unique_code(self):
        """
        Générer un code unique pour le médecin
        """
        while True:
            # Générer un code de 8 caractères alphanumériques
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            # Vérifier que le code est unique
            if not User.objects.filter(code_unique=code).exists():
                return code

    def create(self, validated_data):
        """
        Créer un nouvel utilisateur avec un mot de passe hashé
        """
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data.get('role', '')
        code_medecin = validated_data.pop('code_medecin', '')

        user = User.objects.create(**validated_data)
        user.set_password(password)

        # Si l'utilisateur est un médecin, générer un code unique et créer un profil médecin
        if role == 'medecin':
            user.code_unique = self.generate_unique_code()
            user.save()
            from medecins.models import Medecin
            Medecin.objects.create(user=user)
        # Si l'utilisateur est une réception, lier au médecin via le code
        elif role == 'reception' and code_medecin:
            try:
                medecin = User.objects.get(code_unique=code_medecin, role='medecin')
                user.medecin = medecin
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    "code_medecin": "Code médecin invalide. Veuillez vérifier le code et réessayer."
                })
        # Si l'utilisateur est un patient, l'associer à un médecin par défaut si aucun n'est spécifié
        elif role == 'patient' and not user.medecin:
            # Associer le patient au premier médecin disponible
            from users.models import User
            medecin = User.objects.filter(role='medecin').first()
            if medecin:
                user.medecin = medecin

        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Sérialiseur pour la connexion d'un utilisateur
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})
