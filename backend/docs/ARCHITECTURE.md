# Architecture Technique de l'Application

## Vue d'ensemble

L'application de gestion de rendez-vous médicaux est construite selon une architecture RESTful avec Django et Django REST Framework. Elle suit le modèle Model-View-Template (MVT) de Django, avec une séparation claire entre les modèles de données, les vues API et les sérialiseurs.

## Architecture en Couches

### 1. Couche de Modèles (Models)

Les modèles représentent la structure de la base de données et encapsulent la logique métier liée aux données.

#### Modèle User (users/models.py)
- Hérite de `AbstractUser` de Django
- Ajoute des champs spécifiques à l'application (role, phone, is_reception, is_admin)
- Gère l'authentification et l'autorisation des utilisateurs
- Utilise un gestionnaire personnalisé `UserManager` pour la création d'utilisateurs

#### Modèle Medecin (medecins/models.py)
- Relation OneToOne avec le modèle User
- Stocke les informations spécifiques aux médecins
- Inclut des méthodes pour calculer la disponibilité du médecin

#### Modèle RendezVous (rendezvous/models.py)
- Relations ForeignKey avec User pour le patient et le médecin
- Inclut une contrainte d'unicité sur (medecin, date, heure)
- Méthodes pour vérifier si un rendez-vous est passé ou peut être annulé
- Méthode save surchargée pour mettre à jour automatiquement le statut des rendez-vous passés

### 2. Couche de Sérialiseurs (Serializers)

Les sérialiseurs convertissent les modèles de données en format JSON et vice versa. Ils gèrent également la validation des données.

#### UserSerializer (users/serializers.py)
- Sérialise et valide les données des utilisateurs
- Gère la création et la mise à jour des utilisateurs
- Inclut des validations personnalisées pour les champs spécifiques

#### MedecinSerializer (medecins/serializers.py)
- Sérialise et valide les données des médecins
- Gère les relations avec le modèle User
- Inclut des sérialiseurs spécialisés pour les listes et les détails

#### RendezVousSerializer (rendezvous/serializers.py)
- Sérialise et valide les données des rendez-vous
- Inclut des validations complexes pour vérifier la disponibilité des créneaux
- Gère les relations avec les modèles User (patient et médecin)
- Inclut des sérialiseurs spécialisés pour les listes et les détails

### 3. Couche de Vues (Views)

Les vues gèrent les requêtes HTTP et renvoient les réponses appropriées. Elles utilisent les vues génériques de Django REST Framework pour réduire la duplication de code.

#### Vues Utilisateur (users/views.py)
- Utilise les vues génériques `ListCreateAPIView` et `RetrieveUpdateDestroyAPIView`
- Gère l'authentification et l'autorisation basées sur les rôles
- Inclut des vues personnalisées pour les opérations spécifiques

#### Vues Médecin (medecins/views.py)
- Utilise les vues génériques de Django REST Framework
- Gère les opérations CRUD sur les médecins
- Inclut des vues personnalisées pour les patients et les médecins

#### Vues Rendez-vous (rendezvous/views.py)
- Utilise les vues génériques de Django REST Framework
- Gère les opérations CRUD sur les rendez-vous
- Inclut des vues personnalisées pour les patients, les médecins et la réception

#### Vues Réception (users/reception_views.py)
- Vues spécifiques pour le personnel de réception
- Gère les opérations CRUD sur les utilisateurs, médecins et rendez-vous
- Inclut une vue pour le tableau de bord de la réception

## Flux de Données

### Création d'un rendez-vous

1. Le patient envoie une requête POST à `/api/rendezvous/` avec les détails du rendez-vous
2. La vue `RendezVousListCreateAPIView` reçoit la requête
3. Le sérialiseur `RendezVousSerializer` valide les données :
   - Vérifie que le créneau horaire est disponible
   - Vérifie que le médecin n'a pas atteint son nombre maximum de patients pour la journée
4. Si la validation réussit, le rendez-vous est créé en base de données
5. Le sérialiseur renvoie les données du rendez-vous créé
6. La vue renvoie une réponse HTTP 201 Created avec les données du rendez-vous

### Mise à jour d'un rendez-vous

1. Le médecin ou la réception envoie une requête PUT/PATCH à `/api/rendezvous/{id}/`
2. La vue `RendezVousRetrieveUpdateDestroyAPIView` reçoit la requête
3. Le sérialiseur `RendezVousSerializer` valide les données :
   - Vérifie que le créneau horaire est disponible (si modifié)
   - Vérifie que le médecin n'a pas atteint son nombre maximum de patients pour la journée (si modifié)
4. Si la validation réussit, le rendez-vous est mis à jour en base de données
5. Le sérialiseur renvoie les données du rendez-vous mis à jour
6. La vue renvoie une réponse HTTP 200 OK avec les données du rendez-vous

### Suppression d'un rendez-vous

1. Le patient, le médecin ou la réception envoie une requête DELETE à `/api/rendezvous/{id}/`
2. La vue `RendezVousRetrieveUpdateDestroyAPIView` reçoit la requête
3. La vue vérifie que l'utilisateur a le droit de supprimer le rendez-vous
4. Si l'autorisation est accordée, le rendez-vous est supprimé de la base de données
5. La vue renvoie une réponse HTTP 204 No Content

## Sécurité

### Authentification

L'application utilise l'authentification par token de Django REST Framework :
- Chaque utilisateur reçoit un token lors de sa connexion
- Le token doit être inclus dans l'en-tête `Authorization` de chaque requête
- Les tokens sont stockés en base de données et peuvent être révoqués

### Autorisation

L'application utilise des permissions basées sur les rôles :
- `IsAuthenticated` : L'utilisateur doit être connecté
- `IsAdminUser` : L'utilisateur doit être un administrateur
- Permissions personnalisées pour vérifier les rôles spécifiques (patient, médecin, réception)

### Validation des Données

La validation des données est effectuée à plusieurs niveaux :
- Au niveau des modèles (validators Django)
- Au niveau des sérialiseurs (méthodes validate)
- Au niveau des vues (permissions)

## Gestion des Erreurs

L'application utilise les exceptions de Django REST Framework pour la gestion des erreurs :
- `ValidationError` : Erreurs de validation des données
- `PermissionDenied` : Erreurs d'autorisation
- `NotFound` : Ressource non trouvée
- Les exceptions sont automatiquement converties en réponses HTTP appropriées

## Performance

### Optimisations des Requêtes

- Utilisation de `select_related` pour les relations ForeignKey
- Utilisation de `prefetch_related` pour les relations ManyToMany
- Pagination pour limiter le nombre de résultats retournés
- Indexation des champs fréquemment utilisés dans les requêtes

### Mise en Cache

- Configuration du cache pour les requêtes fréquemment utilisées
- Utilisation des en-têtes Cache-Control pour les fichiers statiques
- Configuration du cache pour les fichiers médias stockés sur S3

## Déploiement

### Environnement de Développement

- Serveur de développement Django
- Base de données SQLite
- Fichiers médias stockés localement
- DEBUG=True

### Environnement de Production

- Serveur WSGI (Gunicorn)
- Serveur web (Nginx)
- Base de données PostgreSQL
- Fichiers médias stockés sur AWS S3
- DEBUG=False
- HTTPS obligatoire
- Configuration du cache (Redis)

## Évolutivité

L'application est conçue pour être évolutive :
- Architecture RESTful facile à scaler horizontalement
- Séparation claire des composants
- Utilisation de services gérés (S3, PostgreSQL)
- Configuration flexible via variables d'environnement

## Maintenance

### Gestion des Logs

- Utilisation du module logging de Python
- Configuration des niveaux de log (DEBUG, INFO, WARNING, ERROR)
- Stockage des logs dans des fichiers ou un service de log centralisé

### Mises à Jour

- Utilisation des migrations Django pour les modifications du schéma de base de données
- Tests automatisés pour vérifier les régressions
- Documentation des modifications dans les notes de version

### Sauvegardes

- Sauvegardes régulières de la base de données
- Sauvegardes des fichiers médias stockés sur S3
- Sauvegardes des fichiers de configuration
