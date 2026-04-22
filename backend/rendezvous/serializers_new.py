from rest_framework import serializers
from users.serializers import UserSerializer
from .models import RendezVous


class RendezVousSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle RendezVous
    """
    patient = UserSerializer(read_only=True)
    medecin = UserSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    medecin_id = serializers.IntegerField(write_only=True, required=False)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = RendezVous
        fields = [
            'id', 'patient', 'patient_id', 'medecin', 'medecin_id',
            'date', 'heure', 'statut', 'statut_display',
            'motif', 'notes', 'cree_le', 'modifie_le'
        ]
        read_only_fields = ['id', 'cree_le', 'modifie_le']

    def validate(self, attrs):
        """
        Valider que le créneau horaire est disponible et que le nombre maximum de patients par jour n'est pas dépassé
        """
        from medecins.models import Medecin

        medecin_id = attrs.get('medecin_id', self.instance.medecin_id if self.instance else None)
        date = attrs.get('date', self.instance.date if self.instance else None)
        heure = attrs.get('heure', self.instance.heure if self.instance else None)

        # Vérifier si un rendez-vous existe déjà pour ce créneau
        if medecin_id and date and heure:
            existing_rdv = RendezVous.objects.filter(
                medecin_id=medecin_id,
                date=date,
                heure=heure,
                statut__in=['confirme', 'en_attente']
            ).exclude(id=self.instance.id if self.instance else None)

            if existing_rdv.exists():
                raise serializers.ValidationError({
                    "heure": "Ce créneau horaire est déjà pris."
                })

        # Vérifier si le nombre maximum de patients par jour n'est pas dépassé
        if medecin_id and date:
            # Récupérer le profil du médecin pour obtenir le nombre maximum de patients par jour
            try:
                medecin_profile = Medecin.objects.get(user_id=medecin_id)
                max_patients = medecin_profile.max_patients_par_jour or 10  # 10 patients par défaut
            except Medecin.DoesNotExist:
                # Si le profil du médecin n'existe pas, utiliser la valeur par défaut
                max_patients = 10  # 10 patients par défaut

            # Compter le nombre de rendez-vous pour ce jour
            rdv_count = RendezVous.objects.filter(
                medecin_id=medecin_id,
                date=date,
                statut__in=['confirme', 'en_attente']
            ).exclude(id=self.instance.id if self.instance else None).count()

            if rdv_count >= max_patients:
                raise serializers.ValidationError({
                    "date": f"Le médecin a déjà atteint son nombre maximum de patients ({max_patients}) pour cette date."
                })

        return attrs

    def create(self, validated_data):
        """
        Créer un rendez-vous en définissant le patient comme l'utilisateur connecté
        """
        print(f"Données validées: {validated_data}")
        patient_id = validated_data.pop('patient_id', None)
        medecin_id = validated_data.pop('medecin_id', None)

        print(f"Patient ID: {patient_id}")
        print(f"Médecin ID: {medecin_id}")
        print(f"Utilisateur connecté: {self.context['request'].user}")

        # Si patient_id n'est pas fourni, utiliser l'utilisateur connecté
        if not patient_id:
            patient_id = self.context['request'].user.id
            print(f"Utilisation de l'utilisateur connecté comme patient: {patient_id}")

        # Si medecin_id n'est pas fourni, utiliser l'utilisateur connecté
        if not medecin_id:
            medecin_id = self.context['request'].user.id
            print(f"Utilisation de l'utilisateur connecté comme médecin: {medecin_id}")

        # S'assurer que le patient est visible pour la réception
        from users.models import User
        patient = User.objects.get(id=patient_id)
        if not patient.visible_for_reception:
            patient.visible_for_reception = True
            patient.save()
            print(f"Patient {patient.username} marqué comme visible pour la réception")

        print(f"Tentative de création de rendez-vous avec patient_id={patient_id}, medecin_id={medecin_id}")
        rendezvous = RendezVous.objects.create(
            patient_id=patient_id,
            medecin_id=medecin_id,
            **validated_data
        )
        print(f"Rendez-vous créé avec succès: {rendezvous}")
        return rendezvous

    def update(self, instance, validated_data):
        """
        Mettre à jour un rendez-vous et les informations associées du patient et du médecin
        """
        patient_id = validated_data.pop('patient_id', None)
        medecin_id = validated_data.pop('medecin_id', None)

        # Mettre à jour le patient si l'ID est fourni
        if patient_id is not None:
            instance.patient_id = patient_id

        # Mettre à jour le médecin si l'ID est fourni
        if medecin_id is not None:
            instance.medecin_id = medecin_id

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class RendezVousListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur simplifié pour la liste des rendez-vous
    """
    patient = serializers.IntegerField(source='patient.id', read_only=True)
    patient_nom = serializers.CharField(source='patient.last_name', read_only=True)
    patient_prenom = serializers.CharField(source='patient.first_name', read_only=True)
    patient_email = serializers.EmailField(source='patient.email', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    medecin_nom = serializers.CharField(source='medecin.get_full_name', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    type_consultation_display = serializers.CharField(source='get_type_consultation_display', read_only=True)

    class Meta:
        model = RendezVous
        fields = [
            'id', 'patient', 'patient_nom', 'patient_prenom', 'patient_email', 'patient_phone',
            'medecin_nom', 'date', 'heure', 'statut', 'statut_display',
            'type_consultation', 'type_consultation_display', 'motif', 'notes'
        ]
