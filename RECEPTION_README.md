# Système de Gestion par la Réception

Ce document décrit le système de gestion par la réception mis en place pour le projet de rendez-vous médicaux.

## Vue d'ensemble

Le système de réception permet au personnel de la réception du cabinet médical de gérer :
- Les patients
- Les médecins
- Les rendez-vous

## Rôle de Réception

Le rôle de réception a été ajouté au système avec les permissions suivantes :
- Créer, lire, mettre à jour et supprimer des utilisateurs
- Créer, lire, mettre à jour et supprimer des médecins
- Créer, lire, mettre à jour et supprimer des rendez-vous
- Accéder au tableau de bord avec des statistiques

## Création d'un Compte Réception

### Via l'interface d'inscription

1. Allez sur la page d'inscription
2. Remplissez le formulaire d'inscription
3. Sélectionnez "Réception" dans le menu déroulant des rôles
4. Soumettez le formulaire

### Via l'interface d'administration Django

1. Connectez-vous à l'interface d'administration Django
2. Allez dans la section "Utilisateurs"
3. Cliquez sur "Ajouter utilisateur"
4. Remplissez les informations de l'utilisateur
5. Sélectionnez "Réception" dans le champ "Rôle"
6. Sauvegardez l'utilisateur

## Accès à l'Espace Réception

Une fois connecté avec un compte de réception, vous pouvez accéder à :
- **Tableau de bord** : `/reception/dashboard` - Vue d'ensemble avec des statistiques
- **Gestion des patients** : `/reception/users` - Liste et gestion des patients
- **Gestion des médecins** : `/reception/medecins` - Liste et gestion des médecins
- **Gestion des rendez-vous** : `/reception/rendezvous` - Liste et gestion des rendez-vous

## Fonctionnalités

### Tableau de Bord

Le tableau de bord affiche :
- Le nombre total de patients
- Le nombre total de médecins
- Le nombre total de rendez-vous
- Le nombre de rendez-vous en attente
- Le nombre de rendez-vous confirmés
- Le nombre de rendez-vous annulés
- Le nombre de rendez-vous du jour

### Gestion des Patients

Permet de :
- Lister tous les patients
- Rechercher des patients par nom ou email
- Filtrer par rôle
- Voir les détails d'un patient
- Supprimer un patient

### Gestion des Médecins

Permet de :
- Lister tous les médecins
- Rechercher des médecins par nom ou spécialité
- Filtrer par spécialité
- Voir les détails d'un médecin
- Supprimer un médecin

### Gestion des Rendez-vous

Permet de :
- Lister tous les rendez-vous
- Rechercher des rendez-vous par patient ou médecin
- Filtrer par statut (en attente, confirmé, annulé)
- Voir les détails d'un rendez-vous
- Supprimer un rendez-vous

## API Endpoints

Les endpoints suivants sont disponibles pour la réception :

- `GET /api/users/reception/dashboard/` - Statistiques du tableau de bord
- `GET /api/users/reception/users/` - Liste des utilisateurs
- `POST /api/users/reception/users/` - Créer un utilisateur
- `GET /api/users/reception/users/<id>/` - Détails d'un utilisateur
- `PUT /api/users/reception/users/<id>/` - Mettre à jour un utilisateur
- `DELETE /api/users/reception/users/<id>/` - Supprimer un utilisateur
- `GET /api/users/reception/medecins/` - Liste des médecins
- `POST /api/users/reception/medecins/` - Créer un médecin
- `GET /api/users/reception/medecins/<id>/` - Détails d'un médecin
- `PUT /api/users/reception/medecins/<id>/` - Mettre à jour un médecin
- `DELETE /api/users/reception/medecins/<id>/` - Supprimer un médecin
- `GET /api/users/reception/rendezvous/` - Liste des rendez-vous
- `POST /api/users/reception/rendezvous/` - Créer un rendez-vous
- `GET /api/users/reception/rendezvous/<id>/` - Détails d'un rendez-vous
- `PUT /api/users/reception/rendezvous/<id>/` - Mettre à jour un rendez-vous
- `DELETE /api/users/reception/rendezvous/<id>/` - Supprimer un rendez-vous

## Sécurité

- Tous les endpoints de réception nécessitent une authentification
- Seuls les utilisateurs avec le rôle "réception" ou "admin" peuvent accéder à ces endpoints
- Les actions sensibles (suppression) nécessitent une confirmation
