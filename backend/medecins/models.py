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
    # Horaires de travail pour les médecins (gérés par la réception)
    lundi_actif = models.BooleanField(default=True, verbose_name="Lundi actif")
    lundi_debut = models.TimeField(default='08:00', verbose_name="Lundi heure de début")
    lundi_fin = models.TimeField(default='23:59', verbose_name="Lundi heure de fin")
    mardi_actif = models.BooleanField(default=True, verbose_name="Mardi actif")
    mardi_debut = models.TimeField(default='08:00', verbose_name="Mardi heure de début")
    mardi_fin = models.TimeField(default='23:59', verbose_name="Mardi heure de fin")
    mercredi_actif = models.BooleanField(default=True, verbose_name="Mercredi actif")
    mercredi_debut = models.TimeField(default='08:00', verbose_name="Mercredi heure de début")
    mercredi_fin = models.TimeField(default='23:59', verbose_name="Mercredi heure de fin")
    jeudi_actif = models.BooleanField(default=True, verbose_name="Jeudi actif")
    jeudi_debut = models.TimeField(default='08:00', verbose_name="Jeudi heure de début")
    jeudi_fin = models.TimeField(default='23:59', verbose_name="Jeudi heure de fin")
    vendredi_actif = models.BooleanField(default=True, verbose_name="Vendredi actif")
    vendredi_debut = models.TimeField(default='08:00', verbose_name="Vendredi heure de début")
    vendredi_fin = models.TimeField(default='23:59', verbose_name="Vendredi heure de fin")
    samedi_actif = models.BooleanField(default=False, verbose_name="Samedi actif")
    samedi_debut = models.TimeField(default='08:00', verbose_name="Samedi heure de début")
    samedi_fin = models.TimeField(default='12:00', verbose_name="Samedi heure de fin")
    dimanche_actif = models.BooleanField(default=False, verbose_name="Dimanche actif")
    dimanche_debut = models.TimeField(default='08:00', verbose_name="Dimanche heure de début")
    dimanche_fin = models.TimeField(default='12:00', verbose_name="Dimanche heure de fin")
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
        return f"{self.user.first_name} {self.user.last_name} - {self.specialite if self.specialite else 'Non spécifié'}"

    @property
    def nom_complet(self):
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def prenom(self):
        return self.user.first_name

    @property
    def nom(self):
        return self.user.last_name
