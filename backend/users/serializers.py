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
    medecin_id = serializers.IntegerField(source='medecin.id', read_only=True)
    medecin = serializers.SerializerMethodField()
    rendezvous_count = serializers.IntegerField(source='total_rendezvous_count', read_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'phone', 'date_of_birth', 'address', 'city', 
            'photo', 'created_at', 'updated_at', 'password', 'is_active', 'visible_for_reception', 'medecin', 'medecin_id', 'rendezvous_count', 'code_unique'
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
    
    def to_representation(self, instance):
        """
        Personnaliser la représentation pour inclure les détails du médecin
        """
        representation = super().to_representation(instance)
        if instance.medecin:
            representation['medecin'] = {
                'id': instance.medecin.id,
                'username': instance.medecin.username,
                'first_name': instance.medecin.first_name,
                'last_name': instance.medecin.last_name,
                'email': instance.medecin.email
            }
        else:
            representation['medecin'] = None
        return representation

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
        if attrs.get('role') == 'reception' and not attrs.get('code_medecin'):
            raise serializers.ValidationError({
                "code_medecin": "Le code du médecin est requis pour s'inscrire en tant que réception."
           })

        return attrs
    
    def generate_unique_code(self):
        """
        Générer un code unique pour le médecin
        """
        import random
        import string
    
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
        # Les patients ne sont pas associés à un médecin par défaut
        # Ils choisiront un médecin lors de la prise de rendez-vous


        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Sérialiseur pour la connexion d'un utilisateur
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})
