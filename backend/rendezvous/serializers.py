from rest_framework import serializers
from users.serializers import UserSerializer
from .models import RendezVous, NotePatient, NotificationUrgente


class NotePatientSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle NotePatient
    """
    patient = UserSerializer(read_only=True)
    medecin = UserSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    medecin_id = serializers.IntegerField(write_only=True, required=False)
    contenu = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = NotePatient
        fields = [
            'id', 'patient', 'patient_id', 'medecin', 'medecin_id',
            'contenu', 'cree_le', 'modifie_le'
        ]
        read_only_fields = ['id', 'cree_le', 'modifie_le', 'patient', 'medecin']

    def create(self, validated_data):
        """
        Créer ou mettre à jour une note pour un patient
        """
        patient_id = validated_data.pop('patient_id', None)
        medecin_id = validated_data.pop('medecin_id', None)

        # Si patient_id n'est pas fourni, utiliser l'utilisateur connecté
        if not patient_id:
            patient_id = self.context['request'].user.id

        # Si medecin_id n'est pas fourni, utiliser l'utilisateur connecté
        if not medecin_id:
            medecin_id = self.context['request'].user.id

        # Vérifier que les IDs sont différents
        if patient_id == medecin_id:
            raise serializers.ValidationError({
                "medecin_id": "Le patient et le médecin ne peuvent pas être la même personne."
            })

        # Vérifier que les utilisateurs existent et ont les bons rôles
        from users.models import User
        try:
            patient = User.objects.get(id=patient_id)
            if not patient.is_patient:
                raise serializers.ValidationError({
                    "patient_id": "L'utilisateur avec cet ID n'est pas un patient."
                })
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "patient_id": "L'utilisateur avec cet ID n'existe pas."
            })

        try:
            medecin = User.objects.get(id=medecin_id)
            if not medecin.is_medecin:
                raise serializers.ValidationError({
                    "medecin_id": "L'utilisateur avec cet ID n'est pas un médecin."
                })
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "medecin_id": "L'utilisateur avec cet ID n'existe pas."
            })

        # Créer ou mettre à jour la note
        note, created = NotePatient.objects.update_or_create(
            patient_id=patient_id,
            medecin_id=medecin_id,
            defaults={'contenu': validated_data.get('contenu', '')}
        )

        return note

    def update(self, instance, validated_data):
        """
        Mettre à jour une note existante
        """
        # Supprimer les champs patient_id et medecin_id des données validées
        validated_data.pop('patient_id', None)
        validated_data.pop('medecin_id', None)
        
        # Mettre à jour le contenu de la note
        if 'contenu' in validated_data:
            instance.contenu = validated_data['contenu']
        
        instance.save()
        return instance


class RendezVousSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle RendezVous
    """
    patient = UserSerializer(read_only=True)
    medecin = UserSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    medecin_id = serializers.IntegerField(write_only=True, required=False)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    type_consultation = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = RendezVous
        fields = [
            'id', 'patient', 'patient_id', 'medecin', 'medecin_id',
            'date', 'heure', 'statut', 'statut_display', 'type_consultation', 'priorite',
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

        # Vérifier que les IDs sont différents pour éviter l'inversion des rôles
        if patient_id == medecin_id:
            raise serializers.ValidationError({
                "medecin_id": "Le patient et le médecin ne peuvent pas être la même personne."
            })

        # Vérifier que les utilisateurs existent et ont les bons rôles
        from users.models import User
        try:
            patient = User.objects.get(id=patient_id)
            if not patient.is_patient:
                raise serializers.ValidationError({
                    "patient_id": "L'utilisateur avec cet ID n'est pas un patient."
                })
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "patient_id": "L'utilisateur avec cet ID n'existe pas."
            })

        try:
            medecin = User.objects.get(id=medecin_id)
            if not medecin.is_medecin:
                raise serializers.ValidationError({
                    "medecin_id": "L'utilisateur avec cet ID n'est pas un médecin."
                })
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "medecin_id": "L'utilisateur avec cet ID n'existe pas."
            })

        # S'assurer que le patient est visible pour la réception
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
        if not patient.medecin:
            patient.medecin = medecin
            patient.save()
            
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
    patient = UserSerializer(read_only=True)
    medecin = UserSerializer(read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    type_consultation_display = serializers.CharField(source='get_type_consultation_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)

    class Meta:
        model = RendezVous
        fields = [
            'id', 'patient', 'medecin', 'date', 'heure', 'statut', 'statut_display',
            'type_consultation', 'type_consultation_display', 'priorite', 'priorite_display', 'motif', 'notes'
        ]


class NotificationUrgenteSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les notifications urgentes
    """
    rendezvous = RendezVousListSerializer(read_only=True)

    class Meta:
        model = NotificationUrgente
        fields = ['id', 'rendezvous', 'message', 'lu', 'acquitte', 'cree_le']
        read_only_fields = ['id', 'cree_le']
