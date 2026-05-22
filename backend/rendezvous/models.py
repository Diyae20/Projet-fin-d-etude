from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User
from medecins.models import Medecin


class NotePatient(models.Model):
    """
    Modèle pour les notes des patients par les médecins
    """
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notes_patient',
        limit_choices_to={'role': 'patient'},
        verbose_name="Patient"
    )
    medecin = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notes_medecin',
        limit_choices_to={'role': 'medecin'},
        verbose_name="Médecin"
    )
    contenu = models.TextField(
        verbose_name="Contenu de la note"
    )
    cree_le = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    modifie_le = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    class Meta:
        verbose_name = "Note patient"
        verbose_name_plural = "Notes patients"
        unique_together = ['patient', 'medecin']
        ordering = ['-modifie_le']

    def __str__(self):
        return f"Note du Dr. {self.medecin.first_name} {self.medecin.last_name} pour {self.patient.first_name} {self.patient.last_name}"


class RendezVous(models.Model):
    """
    Modèle pour les rendez-vous médicaux
    """
    STATUT_CHOICES = [
        ('confirme', 'Confirmé'),
        ('annule', 'Annulé'),
        ('passe', 'Passé'),
        ('en_attente', 'En attente'),
    ]

    TYPE_CONSULTATION_CHOICES = [
        ('consultation', 'Consultation'),
        ('urgence', 'Urgence'),
    ]

    patient = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='rendezvous_patient',
        limit_choices_to={'role': 'patient'},
        verbose_name="Patient"
    )
    medecin = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='rendezvous_medecin',
        limit_choices_to={'role': 'medecin'},
        verbose_name="Médecin"
    )
    date = models.DateField(
        verbose_name="Date du rendez-vous"
    )
    heure = models.TimeField(
        verbose_name="Heure du rendez-vous"
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente',
        verbose_name="Statut"
    )
    type_consultation = models.CharField(
        max_length=20,
        choices=TYPE_CONSULTATION_CHOICES,
        default=None,
        null=True,
        blank=True,
        verbose_name="Type de consultation"
    )
    priorite = models.CharField(
        max_length=20,
        choices=[
            ('normale', 'Normale'),
            ('basse', 'Basse'),
            ('moyenne', 'Moyenne'),
            ('urgente', 'Urgente'),
        ],
        default='normale',
        verbose_name="Priorité du rendez-vous"
    )
    motif = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Motif de consultation"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Notes (médecin)"
    )
    cree_le = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    modifie_le = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    class Meta:
        verbose_name = "Rendez-vous"
        verbose_name_plural = "Rendez-vous"
        ordering = ['date', 'heure']
        unique_together = ['medecin', 'date', 'heure']

    def __str__(self):
        return f"Rendez-vous le {self.date} à {self.heure} - Dr. {self.medecin.first_name} {self.medecin.last_name}"

    def save(self, *args, **kwargs):
        """
        Mettre à jour le statut du rendez-vous si la date est passée
        """
        if self.statut == 'confirme' and self.date < timezone.now().date():
            self.statut = 'passe'
        super().save(*args, **kwargs)

    @property
    def est_passe(self):
        """
        Vérifier si le rendez-vous est passé
        """
        return self.date < timezone.now().date()

    @property
    def peut_etre_annule(self):
        """
        Vérifier si le rendez-vous peut être annulé
        """
        return self.statut in ['confirme', 'en_attente'] and not self.est_passe


class NotificationUrgente(models.Model):
    """
    Modèle pour les notifications urgentes destinées à la réception
    """
    rendezvous = models.ForeignKey(
        RendezVous,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="Rendez-vous"
    )
    message = models.TextField(
        verbose_name="Message de la notification"
    )
    lu = models.BooleanField(
        default=False,
        verbose_name="Lu"
    )
    acquitte = models.BooleanField(
        default=False,
        verbose_name="Acquitté"
    )
    cree_le = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )

    class Meta:
        verbose_name = "Notification urgente"
        verbose_name_plural = "Notifications urgentes"
        ordering = ['-cree_le']

    def __str__(self):
        return f"Notification urgente - {self.message[:50]} - {'Lu' if self.lu else 'Non lu'}"
