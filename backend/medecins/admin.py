from django.contrib import admin
from .models import Specialite, Medecin


@admin.register(Specialite)
class SpecialiteAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour le modèle Specialite
    """
    list_display = ['nom', 'created_at']
    search_fields = ['nom', 'description']
    list_filter = ['created_at']


@admin.register(Medecin)
class MedecinAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour le modèle Medecin
    """
    list_display = ['get_username', 'get_email', 'nom_complet', 'specialite', 'ville', 'telephone', 'created_at']
    list_filter = ['specialite', 'ville', 'created_at']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 'specialite__nom', 'ville']
    readonly_fields = ['created_at', 'updated_at', 'get_username', 'get_email']

    fieldsets = (
        ('Informations utilisateur', {
            'fields': ('user', 'get_username', 'get_email')
        }),
        ('Informations professionnelles', {
            'fields': ('specialite', 'bio', 'duree_consultation')
        }),
        ('Informations de contact', {
            'fields': ('adresse_cabinet', 'telephone', 'ville')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Nom d\'utilisateur'

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'
