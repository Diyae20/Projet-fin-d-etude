from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Specialite, Medecin


class SpecialiteSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Specialite
    """
    class Meta:
        model = Specialite
        fields = ['id', 'nom', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class MedecinSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Medecin
    """
    user = UserSerializer(read_only=True)
    specialite = SpecialiteSerializer(read_only=True)
    specialite_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    photo = serializers.ImageField(source='user.photo', required=False, allow_null=True)
    first_name = serializers.CharField(write_only=True, required=False, allow_null=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_null=True)
    email = serializers.EmailField(write_only=True, required=False, allow_null=True)
    suggestions_config = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Medecin
        fields = [
            'id', 'user', 'specialite', 'specialite_id', 'bio',
            'adresse_cabinet', 'telephone', 'ville', 'duree_consultation',
            'max_patients_par_jour', 'created_at', 'updated_at', 'photo',
            'first_name', 'last_name', 'email', 'suggestions_config',
            'lundi_actif', 'lundi_debut', 'lundi_fin',
            'mardi_actif', 'mardi_debut', 'mardi_fin',
            'mercredi_actif', 'mercredi_debut', 'mercredi_fin',
            'jeudi_actif', 'jeudi_debut', 'jeudi_fin',
            'vendredi_actif', 'vendredi_debut', 'vendredi_fin',
            'samedi_actif', 'samedi_debut', 'samedi_fin',
            'dimanche_actif', 'dimanche_debut', 'dimanche_fin'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        """
        Mettre à jour un médecin en gérant la spécialité, la photo de profil et les informations de l'utilisateur
        """
        specialite_id = validated_data.pop('specialite_id', None)
        specialite_nom = validated_data.pop('specialite_nom', None)
        remove_photo = self.context.get('request').data.get('remove_photo', None)

        # Mettre à jour les champs de l'utilisateur
        if 'first_name' in validated_data:
            instance.user.first_name = validated_data.pop('first_name')
        if 'last_name' in validated_data:
            instance.user.last_name = validated_data.pop('last_name')
        if 'email' in validated_data:
            instance.user.email = validated_data.pop('email')

        # Sauvegarder l'utilisateur si des champs ont été modifiés
        instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Gérer la spécialité par nom
        if specialite_nom:
            try:
                specialite = Specialite.objects.get(nom__iexact=specialite_nom)
                instance.specialite = specialite
            except Specialite.DoesNotExist:
                # Créer une nouvelle spécialité si elle n'existe pas
                specialite = Specialite.objects.create(nom=specialite_nom)
                instance.specialite = specialite
        # Gérer la spécialité par ID
        elif specialite_id is not None:
            try:
                specialite = Specialite.objects.get(id=specialite_id)
                instance.specialite = specialite
            except Specialite.DoesNotExist:
                pass

        # Supprimer la photo si demandé
        if remove_photo == 'true' or remove_photo is True:
            instance.user.photo = None
            instance.user.save()

        instance.save()
        return instance

    def to_representation(self, instance):
        """
        Personnaliser la représentation pour inclure la photo du médecin
        """
        representation = super().to_representation(instance)
        # Inclure la photo du médecin
        if instance.user and instance.user.photo:
            representation['photo'] = instance.user.photo.url
        else:
            representation['photo'] = None
        return representation


class MedecinListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur simplifié pour la liste des médecins
    """
    nom_complet = serializers.CharField(read_only=True)
    specialite = serializers.CharField(source='specialite.nom', read_only=True, allow_null=True)
    specialite_obj = SpecialiteSerializer(source='specialite', read_only=True)
    photo = serializers.ImageField(source='user.photo', read_only=True)
    user = UserSerializer(read_only=True)
    suggestions_config = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Medecin
        fields = [
            'id', 'nom_complet', 'specialite', 'specialite_obj', 'photo', 'user',
            'ville', 'adresse_cabinet', 'telephone', 'suggestions_config'
        ]


class MedecinDetailSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les détails d'un médecin
    """
    nom_complet = serializers.CharField(read_only=True)
    specialite = SpecialiteSerializer(read_only=True)
    photo = serializers.ImageField(source='user.photo', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    prenom = serializers.CharField(read_only=True)
    nom = serializers.CharField(read_only=True)
    suggestions_config = serializers.JSONField(required=False, allow_null=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Medecin
        fields = [
            'id', 'nom_complet', 'specialite', 'photo', 'email', 'first_name', 'last_name', 'prenom', 'nom', 'bio',
            'adresse_cabinet', 'telephone', 'ville', 'duree_consultation',
            'max_patients_par_jour', 'created_at', 'updated_at', 'suggestions_config', 'user',
            'lundi_actif', 'lundi_debut', 'lundi_fin',
            'mardi_actif', 'mardi_debut', 'mardi_fin',
            'mercredi_actif', 'mercredi_debut', 'mercredi_fin',
            'jeudi_actif', 'jeudi_debut', 'jeudi_fin',
            'vendredi_actif', 'vendredi_debut', 'vendredi_fin',
            'samedi_actif', 'samedi_debut', 'samedi_fin',
            'dimanche_actif', 'dimanche_debut', 'dimanche_fin'
        ]
