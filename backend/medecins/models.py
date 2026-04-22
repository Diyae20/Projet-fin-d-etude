from django.db import models
from users.models import User

class Specialite(models.Model):
    """
    Modèle pour les spécialités médicales (ex: Cardiologue, Dentiste...)
    """
    nom = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name="Nom de la spécialité"
    )
    description = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Description"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )

    class Meta:
        verbose_name = "Spécialité"
        verbose_name_plural = "Spécialités"
        ordering = ['nom']

    def __str__(self):
        return self.nom


class Medecin(models.Model):
    """
    Modèle pour les informations supplémentaires des médecins
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='medecin_profile',
        limit_choices_to={'role': 'medecin'},
        verbose_name="Utilisateur"
    )
    specialite = models.ForeignKey(
        Specialite,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medecins',
        verbose_name="Spécialité"
    )
    bio = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Biographie / Présentation"
    )
    adresse_cabinet = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Adresse du cabinet"
    )
    telephone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name="Téléphone du cabinet"
    )
    ville = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Ville"
    )
    duree_consultation = models.IntegerField(
        default=30,
        verbose_name="Durée moyenne d'une consultation (en minutes)"
    )
    max_patients_par_jour = models.IntegerField(
        default=10,
        verbose_name="Nombre maximum de patients par jour"
    )
    suggestions_config = models.JSONField(
    blank=True,
    null=True,
    verbose_name="Configuration des suggestions",
    default=dict,
    help_text="Configuration des suggestions pré-définies pour les boutons de priorité"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de mise à jour"
    )

    class Meta:
        verbose_name = "Médecin"
        verbose_name_plural = "Médecins"

    def __str__(self):
        return f"Dr. {self.user.first_name} {self.user.last_name} - {self.specialite if self.specialite else 'Non spécifié'}"

    @property
    def nom_complet(self):
        return f"Dr. {self.user.first_name} {self.user.last_name}"

    @property
    def prenom(self):
        return self.user.first_name

    @property
    def nom(self):
        return self.user.last_name
