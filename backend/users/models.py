from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Modèle utilisateur personnalisé avec rôles (patient, médecin, admin)
    """
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('medecin', 'Médecin'),
        ('reception', 'Réception'),
        ('admin', 'Administrateur'),
    ]

    role = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES, 
        default='patient'
    )
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name="Téléphone"
    )
    date_of_birth = models.DateField(
        blank=True, 
        null=True,
        verbose_name="Date de naissance"
    )
    address = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Adresse"
    )
    city = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Ville"
    )
    photo = models.ImageField(
        upload_to='users/photos/', 
        blank=True, 
        null=True,
        verbose_name="Photo de profil"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )

    def save(self, *args, **kwargs):
        # Définir automatiquement le rôle admin pour les superutilisateurs
        if self.is_superuser:
            self.role = 'admin'
        # Si l'utilisateur n'est pas superutilisateur et n'a pas de rôle défini, utiliser patient par défaut
        elif not self.role:
            self.role = 'patient'
        super().save(*args, **kwargs)
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de mise à jour"
    )

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

    @property
    def is_patient(self):
        return self.role == 'patient'

    @property
    def is_medecin(self):
        return self.role == 'medecin'

    @property
    def is_reception(self):
        return self.role == 'reception'

    @property
    def is_admin(self):
        return self.role == 'admin'

    def get_full_name(self):
        """
        Retourner le nom complet de l'utilisateur
        """
        return f"{self.first_name} {self.last_name}".strip()
