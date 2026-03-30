from django.contrib import admin
from .models import RendezVous


@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour le modèle RendezVous
    """
    list_display = ['patient', 'medecin', 'date', 'heure', 'statut', 'cree_le']
    list_filter = ['statut', 'date', 'medecin']
    search_fields = ['patient__first_name', 'patient__last_name', 'medecin__first_name', 'medecin__last_name', 'motif']
    readonly_fields = ['cree_le', 'modifie_le']

    fieldsets = (
        ('Informations de base', {
            'fields': ('patient', 'medecin', 'date', 'heure', 'statut')
        }),
        ('Détails', {
            'fields': ('motif', 'notes')
        }),
        ('Métadonnées', {
            'fields': ('cree_le', 'modifie_le'),
            'classes': ('collapse',)
        }),
    )
