# Projet de Gestion de Rendez-vous Médicaux

Ce projet est une application web complète de gestion de rendez-vous médicaux, développée avec Django (backend) et React (frontend). L'application permet aux patients de prendre rendez-vous avec des médecins, aux médecins de gérer leur agenda, et au personnel de réception de coordonner l'ensemble du processus.

## Sommaire

1. [Architecture du projet](#architecture-du-projet)
2. [Technologies utilisées](#technologies-utilisées)
3. [Installation et configuration](#installation-et-configuration)
4. [Utilisation de l'application](#utilisation-de-lapplication)
5. [Rôles et permissions](#rôles-et-permissions)
6. [API REST](#api-rest)
7. [Déploiement](#déploiement)
8. [Maintenance et surveillance](#maintenance-et-surveillance)
9. [Dépannage](#dépannage)
10. [Contributeurs](#contributeurs)

## Architecture du projet

L'application est divisée en deux parties principales :

### Backend (Django)

Le backend est développé avec Django et Django REST Framework, fournissant une API RESTful pour la gestion des données.

**Structure principale :**
- **users/** : Gestion des utilisateurs, des rôles et de l'authentification
- **medecins/** : Gestion des médecins, de leurs disponibilités et de leurs informations
- **rendezvous/** : Gestion des rendez-vous, des priorités et des notifications

### Frontend (React)

Le frontend est développé avec React, offrant une interface utilisateur moderne et réactive.

**Structure principale :**
- **src/components/** : Composants réutilisables de l'interface
- **src/pages/** : Pages principales de l'application
- **src/services/** : Services pour communiquer avec l'API backend
- **src/contexts/** : Contextes pour la gestion de l'état global

## Technologies utilisées

### Backend
- Django 4.x
- Django REST Framework
- PostgreSQL
- Python 3.10+
- Gunicorn (pour le déploiement)

### Frontend
- React 18.x
- React Router
- Axios
- Tailwind CSS
- Vite

## Installation et configuration

### Prérequis
- Python 3.10 ou supérieur
- Node.js 16 ou supérieur
- PostgreSQL 12 ou supérieur
- Git

### Configuration du backend

1. Cloner le dépôt :
```bash
git clone <url-du-depot>
cd backend
```

2. Créer un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scriptsctivate
```

3. Installer les dépendances :
```bash
pip install -r requirements.txt
```

4. Configurer la base de données :
```bash
sudo -u postgres psql
CREATE DATABASE rendezvous_db;
CREATE USER rendezvous_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE rendezvous_db TO rendezvous_user;
\q
```

5. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Modifier les valeurs dans .env
```

6. Exécuter les migrations :
```bash
python manage.py makemigrations
python manage.py migrate
```

7. Créer un superutilisateur :
```bash
python manage.py createsuperuser
```

8. Lancer le serveur de développement :
```bash
python manage.py runserver
```

### Configuration du frontend

1. Cloner le dépôt frontend :
```bash
cd ../frontend
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

## Utilisation de l'application

### Connexion

1. Accédez à l'application dans votre navigateur
2. Cliquez sur "Connexion"
3. Entrez vos identifiants (nom d'utilisateur et mot de passe)
4. Selon votre rôle, vous serez redirigé vers l'interface appropriée

### Prise de rendez-vous (Patient)

1. Connectez-vous avec un compte patient
2. Accédez à la liste des médecins
3. Sélectionnez un médecin
4. Choisissez un créneau horaire disponible
5. Confirmez le rendez-vous

### Gestion des rendez-vous (Médecin)

1. Connectez-vous avec un compte médecin
2. Consultez votre agenda
3. Gérez vos rendez-vous (confirmation, annulation, etc.)
4. Accédez aux informations des patients

### Gestion administrative (Réception)

1. Connectez-vous avec un compte réception
2. Accédez au tableau de bord pour une vue d'ensemble
3. Gérez les patients, les médecins et les rendez-vous
4. Utilisez les filtres et les outils de recherche

## Rôles et permissions

L'application gère quatre rôles principaux :

1. **Patient** :
   - Prendre rendez-vous
   - Voir ses rendez-vous passés et futurs
   - Gérer son compte

2. **Médecin** :
   - Gérer son profil et ses disponibilités
   - Voir et gérer ses rendez-vous
   - Accéder aux informations des patients

3. **Réception** :
   - Gérer les comptes utilisateurs
   - Gérer les médecins
   - Gérer les rendez-vous
   - Accéder au tableau de bord statistique

4. **Admin** :
   - Accès à toutes les fonctionnalités
   - Gestion globale de l'application
   - Accès à l'interface d'administration Django

## API REST

L'application expose une API RESTful complète pour l'intégration avec d'autres systèmes. La documentation complète de l'API est disponible dans `backend/docs/API.md`.

### Points d'accès principaux

- `/api/auth/` : Authentification (inscription, connexion, déconnexion)
- `/api/users/` : Gestion des utilisateurs
- `/api/medecins/` : Gestion des médecins
- `/api/rendezvous/` : Gestion des rendez-vous

### Exemple d'utilisation

```bash
# Obtenir la liste des médecins
curl -X GET http://localhost:8000/api/medecins/ -H "Authorization: Token <votre-token>"

# Créer un rendez-vous
curl -X POST http://localhost:8000/api/rendezvous/   -H "Authorization: Token <votre-token>"   -H "Content-Type: application/json"   -d '{
    "medecin": 1,
    "date": "2023-12-01",
    "heure": "09:00:00",
    "patient": 1,
    "statut": "en_attente"
  }'
```

## Déploiement

Le guide de déploiement complet est disponible dans `backend/docs/DEPLOYMENT.md`. Les étapes principales incluent :

1. Configuration du serveur (Ubuntu 20.04+)
2. Installation des dépendances (Python, PostgreSQL, Nginx)
3. Configuration de la base de données
4. Configuration de l'application
5. Configuration de Gunicorn
6. Configuration de Nginx
7. Configuration du SSL avec Let's Encrypt
8. Configuration de la surveillance

### Déploiement avec Docker

Un fichier Docker est fourni pour simplifier le déploiement :

```bash
# Construire les images
docker-compose build

# Lancer les conteneurs
docker-compose up -d
```

## Maintenance et surveillance

### Sauvegardes

Configurez des sauvegardes automatiques de la base de données :

```bash
# Crontab pour sauvegarde quotidienne
0 2 * * * pg_dump -U rendezvous_user rendezvous_db > /backups/rendezvous_db_$(date +\%Y\%m\%d).sql
```

### Surveillance

Surveillez les journaux de l'application :

- Logs de Gunicorn : `/var/log/syslog`
- Logs de Nginx : `/var/log/nginx/`
- Logs de l'application : Configurés dans `settings.py`

### Mises à jour

Pour mettre à jour l'application :

```bash
cd /var/www/rendezvous
git pull
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn
```

## Dépannage

### Problèmes courants

#### Erreur 502 Bad Gateway

Vérifiez que Gunicorn fonctionne correctement :
```bash
sudo systemctl status gunicorn
sudo journalctl -u gunicorn
```

#### Erreur de connexion à la base de données

Vérifiez que PostgreSQL fonctionne et que les identifiants sont corrects :
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l
```

#### Erreur de permission sur les fichiers statiques

Vérifiez les permissions sur les fichiers statiques :
```bash
sudo chown -R www-data:www-data /var/www/rendezvous/staticfiles
sudo chmod -R 755 /var/www/rendezvous/staticfiles
```

## Contributeurs

- [Nom du contributeur 1] - Développeur principal
- [Nom du contributeur 2] - Designer UI/UX
- [Nom du contributeur 3] - Administrateur système

## Licence

Ce projet est sous licence [Nom de la licence]. Voir le fichier `LICENSE` pour plus d'informations.
