# Application de Gestion de Rendez-vous Médicaux

## Description

Cette application est un système de gestion de rendez-vous médicaux développé avec Django et Django REST Framework. Elle permet aux patients de prendre rendez-vous avec des médecins, aux médecins de gérer leur agenda, et au personnel de réception de gérer les utilisateurs et les rendez-vous.

## Fonctionnalités

### Pour les patients
- Création et gestion de compte
- Prise de rendez-vous avec des médecins
- Consultation de l'historique des rendez-vous
- Annulation de rendez-vous

### Pour les médecins
- Gestion du profil médical
- Consultation de l'agenda des rendez-vous
- Mise à jour du statut des rendez-vous
- Ajout de notes aux rendez-vous

### Pour la réception
- Gestion des utilisateurs (patients et médecins)
- Gestion des rendez-vous
- Consultation du tableau de bord avec des statistiques

## Architecture du Projet

### Structure du projet

```
backend/
├── config/                 # Configuration principale du projet Django
│   ├── settings.py        # Paramètres de configuration
│   ├── urls.py            # Configuration des URLs principales
│   └── wsgi.py            # Configuration WSGI
├── users/                 # Gestion des utilisateurs
│   ├── models.py          # Modèle User personnalisé
│   ├── serializers.py     # Sérialiseurs pour l'API
│   └── views.py           # Vues pour l'API
├── medecins/              # Gestion des médecins
│   ├── models.py          # Modèle Medecin
│   ├── serializers.py     # Sérialiseurs pour l'API
│   └── views.py           # Vues pour l'API
├── rendezvous/            # Gestion des rendez-vous
│   ├── models.py          # Modèle RendezVous
│   ├── serializers.py     # Sérialiseurs pour l'API
│   └── views.py           # Vues pour l'API
├── requirements.txt       # Dépendances Python
└── .env.example          # Exemple de fichier d'environnement
```

### Modèles de données

#### User (users/models.py)
Modèle utilisateur personnalisé qui étend AbstractUser avec les champs suivants :
- `role`: Rôle de l'utilisateur (patient, médecin, réception, admin)
- `phone`: Numéro de téléphone
- `is_reception`: Indicateur si l'utilisateur est un membre de la réception
- `is_admin`: Indicateur si l'utilisateur est un administrateur

#### Medecin (medecins/models.py)
Profil du médecin avec les informations suivantes :
- `user`: Relation OneToOne avec le modèle User
- `bio`: Biographie du médecin
- `adresse_cabinet`: Adresse du cabinet médical
- `telephone`: Numéro de téléphone du cabinet
- `ville`: Ville du cabinet
- `duree_consultation`: Durée moyenne d'une consultation (en minutes)
- `max_patients_par_jour`: Nombre maximum de patients par jour

#### RendezVous (rendezvous/models.py)
Modèle représentant un rendez-vous médical avec les champs suivants :
- `patient`: Relation ForeignKey vers le modèle User (patient)
- `medecin`: Relation ForeignKey vers le modèle User (médecin)
- `date`: Date du rendez-vous
- `heure`: Heure du rendez-vous
- `statut`: Statut du rendez-vous (confirme, annule, passe, en_attente)
- `motif`: Motif de la consultation
- `notes`: Notes ajoutées par le médecin

## Installation

### Prérequis

- Python 3.10 ou supérieur
- pip (gestionnaire de paquets Python)
- PostgreSQL (en production)
- AWS S3 (en production pour le stockage des fichiers)

### Étapes d'installation

1. Cloner le dépôt :
```bash
git clone <url-du-depot>
cd projet-fin-d-etude/backend
```

2. Créer un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scriptsctivate
```

3. Installer les dépendances :
```bash
pip install -r requirements.txt
```

4. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

5. Exécuter les migrations :
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Créer un superutilisateur :
```bash
python manage.py createsuperuser
```

7. Lancer le serveur de développement :
```bash
python manage.py runserver
```

## Configuration

### Variables d'environnement

Le fichier `.env` doit contenir les variables suivantes :

```env
# Django
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AWS S3 (Production only)
USE_S3=False
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1
```

### Configuration de la base de données

En développement, SQLite est utilisé par défaut. Pour utiliser PostgreSQL en production, modifiez la variable `DATABASE_URL` dans le fichier `.env` :

```env
DATABASE_URL=postgresql://user:password@host:port/database_name
```

### Configuration du stockage S3

Pour utiliser AWS S3 en production, définissez `USE_S3=True` dans le fichier `.env` et configurez les variables AWS S3 appropriées.

## API Documentation

### Endpoints de l'API

#### Authentification
- `POST /api/auth/login/` : Connexion d'un utilisateur
- `POST /api/auth/logout/` : Déconnexion d'un utilisateur
- `POST /api/auth/register/` : Inscription d'un nouvel utilisateur

#### Utilisateurs
- `GET /api/users/` : Liste des utilisateurs
- `POST /api/users/` : Création d'un utilisateur
- `GET /api/users/{id}/` : Détails d'un utilisateur
- `PUT /api/users/{id}/` : Mise à jour d'un utilisateur
- `DELETE /api/users/{id}/` : Suppression d'un utilisateur

#### Médecins
- `GET /api/medecins/` : Liste des médecins
- `POST /api/medecins/` : Création d'un médecin
- `GET /api/medecins/{id}/` : Détails d'un médecin
- `PUT /api/medecins/{id}/` : Mise à jour d'un médecin
- `DELETE /api/medecins/{id}/` : Suppression d'un médecin

#### Rendez-vous
- `GET /api/rendezvous/` : Liste des rendez-vous
- `POST /api/rendezvous/` : Création d'un rendez-vous
- `GET /api/rendezvous/{id}/` : Détails d'un rendez-vous
- `PUT /api/rendezvous/{id}/` : Mise à jour d'un rendez-vous
- `DELETE /api/rendezvous/{id}/` : Suppression d'un rendez-vous

#### Réception
- `GET /api/reception/users/` : Liste des utilisateurs (réception)
- `POST /api/reception/users/` : Création d'un utilisateur (réception)
- `GET /api/reception/users/{id}/` : Détails d'un utilisateur (réception)
- `PUT /api/reception/users/{id}/` : Mise à jour d'un utilisateur (réception)
- `DELETE /api/reception/users/{id}/` : Suppression d'un utilisateur (réception)
- `GET /api/reception/medecins/` : Liste des médecins (réception)
- `POST /api/reception/medecins/` : Création d'un médecin (réception)
- `GET /api/reception/medecins/{id}/` : Détails d'un médecin (réception)
- `PUT /api/reception/medecins/{id}/` : Mise à jour d'un médecin (réception)
- `DELETE /api/reception/medecins/{id}/` : Suppression d'un médecin (réception)
- `GET /api/reception/rendezvous/` : Liste des rendez-vous (réception)
- `POST /api/reception/rendezvous/` : Création d'un rendez-vous (réception)
- `GET /api/reception/rendezvous/{id}/` : Détails d'un rendez-vous (réception)
- `PUT /api/reception/rendezvous/{id}/` : Mise à jour d'un rendez-vous (réception)
- `DELETE /api/reception/rendezvous/{id}/` : Suppression d'un rendez-vous (réception)
- `GET /api/reception/dashboard/` : Tableau de bord de la réception

### Format des requêtes et réponses

Toutes les requêtes doivent inclure un en-tête `Authorization` avec le token d'authentification :

```
Authorization: Token <votre-token>
```

Les réponses sont au format JSON. En cas d'erreur, la réponse contient un champ `detail` avec un message d'erreur.

## Sécurité

### Authentification
L'application utilise l'authentification par token de Django REST Framework. Chaque utilisateur reçoit un token lors de sa connexion qui doit être inclus dans les requêtes ultérieures.

### Autorisation
L'application utilise des permissions basées sur les rôles pour contrôler l'accès aux différentes ressources :
- Les patients peuvent accéder à leurs propres rendez-vous
- Les médecins peuvent accéder à leurs propres rendez-vous et profils
- La réception peut gérer tous les utilisateurs et rendez-vous
- Les administrateurs ont un accès complet

### CORS
La configuration CORS permet à l'application frontend de communiquer avec l'API backend. Les origines autorisées sont configurées dans le fichier `settings.py`.

## Déploiement

### Déploiement en production

1. Configurer les variables d'environnement pour la production
2. Configurer une base de données PostgreSQL
3. Configurer AWS S3 pour le stockage des fichiers médias
4. Configurer un serveur WSGI comme Gunicorn
5. Configurer un serveur web comme Nginx
6. Configurer HTTPS avec un certificat SSL
7. Configurer un système de monitoring et de logging

## Maintenance

### Mises à jour
Pour mettre à jour l'application :
1. Tirer les dernières modifications du dépôt
2. Installer les nouvelles dépendances : `pip install -r requirements.txt`
3. Exécuter les migrations : `python manage.py migrate`
4. Redémarrer le serveur

### Sauvegardes
Il est recommandé de sauvegarder régulièrement :
- La base de données
- Les fichiers médias stockés sur S3
- Les fichiers de configuration

## Contributing

Pour contribuer au projet :
1. Forker le dépôt
2. Créer une branche pour votre fonctionnalité
3. Faire vos modifications
4. Tester vos modifications
5. Soumettre une pull request

## Licence

Ce projet est sous licence [MIT](LICENSE).

## Contact

Pour toute question ou suggestion, veuillez contacter [votre-email@example.com].
