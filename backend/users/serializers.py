from rest_framework import serializers
from .models import User

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

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'phone', 'date_of_birth', 'address', 'city', 
            'photo', 'created_at', 'updated_at', 'password', 'is_active', 'visible_for_reception'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_role(self, value):
        """
        Valider que le rôle est valide
        """
        valid_roles = ['patient', 'medecin', 'reception', 'admin']
        if value and value not in valid_roles:
            raise serializers.ValidationError(f"Le rôle doit être l'une de ces valeurs: {', '.join(valid_roles)}")
        return value

    def create(self, validated_data):
        """
        Créer un utilisateur avec un mot de passe hashé
        """
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user

    def update(self, instance, validated_data):
        """
        Mettre à jour un utilisateur en gérant le mot de passe
        """
        password = validated_data.pop('password', None)
        username = validated_data.pop('username', None)

        # Ne pas mettre à jour le username si non fourni
        if username is not None:
            instance.username = username

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        try:
            instance.full_clean()  # Valider le modèle avant la sauvegarde
            instance.save()
        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})
        
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'inscription d'un nouvel utilisateur
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 
            'role', 'phone', 'date_of_birth', 'address', 'city', 
            'password', 'password_confirm'
        ]

    def validate(self, attrs):
        """
        Vérifier que les mots de passe correspondent
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })

        return attrs

    def create(self, validated_data):
        """
        Créer un nouvel utilisateur avec un mot de passe hashé
        """
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data.get('role', '')

        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        # Si l'utilisateur est un médecin, créer un profil médecin
        if role == 'medecin':
            from medecins.models import Medecin
            Medecin.objects.create(user=user)

        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Sérialiseur pour la connexion d'un utilisateur
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})
