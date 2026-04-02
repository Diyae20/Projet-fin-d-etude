# Guide de Déploiement

Ce guide explique comment déployer l'application de gestion de rendez-vous médicaux en production.

## Prérequis

- Un serveur avec Ubuntu 20.04 ou supérieur
- Python 3.10 ou supérieur
- PostgreSQL 12 ou supérieur
- Nginx
- Un compte AWS avec accès à S3 (optionnel mais recommandé)
- Un nom de domaine avec certificat SSL

## Étape 1 : Préparation du serveur

### Mise à jour du système

```bash
sudo apt update
sudo apt upgrade -y
```

### Installation des dépendances

```bash
sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib nginx certbot python3-certbot-nginx
```

## Étape 2 : Configuration de la base de données

### Création de la base de données

```bash
sudo -u postgres psql
```

Dans le shell PostgreSQL :

```sql
CREATE DATABASE rendezvous_db;
CREATE USER rendezvous_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE rendezvous_db TO rendezvous_user;
\q
```

## Étape 3 : Configuration de l'application

### Clonage du dépôt

```bash
cd /var/www
sudo git clone <url-du-depot> rendezvous
cd rendezvous
```

### Création de l'environnement virtuel

```bash
sudo python3 -m venv venv
sudo chown -R $USER:$USER venv
source venv/bin/activate
```

### Installation des dépendances

```bash
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

### Configuration des variables d'environnement

```bash
cp .env.example .env
nano .env
```

Modifier les variables suivantes :

```env
SECRET_KEY=<votre-secret-key-unique>
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com
DATABASE_URL=postgresql://rendezvous_user:secure_password@localhost/rendezvous_db
CORS_ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
USE_S3=True
AWS_ACCESS_KEY_ID=<votre-clé-d'accès-aws>
AWS_SECRET_ACCESS_KEY=<votre-clé-secrète-aws>
AWS_STORAGE_BUCKET_NAME=<nom-de-votre-bucket>
AWS_S3_REGION_NAME=<votre-région>
```

### Exécution des migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Création d'un superutilisateur

```bash
python manage.py createsuperuser
```

### Collecte des fichiers statiques

```bash
python manage.py collectstatic --noinput
```

## Étape 4 : Configuration de Gunicorn

### Création d'un fichier socket systemd

```bash
sudo nano /etc/systemd/system/gunicorn.socket
```

Contenu du fichier :

```ini
[Unit]
Description=gunicorn socket

[Socket]
ListenStream=/run/gunicorn.sock

[Install]
WantedBy=sockets.target
```

### Création d'un fichier service systemd

```bash
sudo nano /etc/systemd/system/gunicorn.service
```

Contenu du fichier :

```ini
[Unit]
Description=gunicorn daemon for rendezvous application
Requires=gunicorn.socket
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/rendezvous
ExecStart=/var/www/rendezvous/venv/bin/gunicorn           --access-logfile -           --workers 3           --bind unix:/run/gunicorn.sock           config.wsgi:application

[Install]
WantedBy=multi-user.target
```

### Démarrage et activation de Gunicorn

```bash
sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket
```

## Étape 5 : Configuration de Nginx

### Création du fichier de configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/rendezvous
```

Contenu du fichier :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /media/ {
        alias /var/www/rendezvous/media/;
    }

    location /static/ {
        alias /var/www/rendezvous/staticfiles/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn.sock;
    }
}
```

### Activation du site

```bash
sudo ln -s /etc/nginx/sites-available/rendezvous /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

## Étape 6 : Configuration de SSL avec Let's Encrypt

### Obtention du certificat SSL

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Suivez les instructions pour configurer le certificat SSL.

### Renouvellement automatique du certificat

Le renouvellement automatique est configuré par certbot. Vous pouvez vérifier la configuration avec :

```bash
sudo certbot renew --dry-run
```

## Étape 7 : Configuration de AWS S3 (Optionnel)

### Création d'un bucket S3

1. Connectez-vous à la console AWS
2. Accédez au service S3
3. Créez un nouveau bucket avec un nom unique
4. Configurez les permissions du bucket pour permettre l'accès public aux fichiers médias
5. Créez un utilisateur IAM avec les permissions nécessaires pour accéder au bucket
6. Notez les clés d'accès (Access Key ID et Secret Access Key)

### Configuration des variables d'environnement

Ajoutez les variables suivantes à votre fichier `.env` :

```env
USE_S3=True
AWS_ACCESS_KEY_ID=<votre-clé-d'accès>
AWS_SECRET_ACCESS_KEY=<votre-clé-secrète>
AWS_STORAGE_BUCKET_NAME=<nom-de-votre-bucket>
AWS_S3_REGION_NAME=<votre-région>
```

## Étape 8 : Configuration du pare-feu

### Configuration de UFW

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Étape 9 : Surveillance et maintenance

### Configuration des logs

Les logs de l'application sont stockés dans `/var/log/` :

- Logs de Gunicorn : `/var/log/syslog`
- Logs de Nginx : `/var/log/nginx/`
- Logs de l'application : Configurés dans settings.py

### Sauvegardes automatiques

Configurez des sauvegardes automatiques de la base de données :

```bash
sudo crontab -e
```

Ajoutez la ligne suivante pour une sauvegarde quotidienne à 2h du matin :

```
0 2 * * * pg_dump -U rendezvous_user rendezvous_db > /backups/rendezvous_db_$(date +\%Y\%m\%d).sql
```

### Mises à jour de l'application

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

## Étape 10 : Test du déploiement

### Vérification de l'état des services

```bash
sudo systemctl status gunicorn
sudo systemctl status nginx
```

### Test de l'application

1. Accédez à `https://votre-domaine.com` dans votre navigateur
2. Vérifiez que l'application fonctionne correctement
3. Testez les différentes fonctionnalités (connexion, création de rendez-vous, etc.)

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

## Sécurité supplémentaire

### Configuration de fail2ban

```bash
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Configurez les règles pour protéger votre serveur contre les attaques par force brute.

### Mise à jour régulière du système

Configurez des mises à jour automatiques de sécurité :

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Conclusion

Votre application est maintenant déployée en production. Assurez-vous de surveiller régulièrement les logs et les performances de l'application, et de maintenir le système à jour avec les derniers correctifs de sécurité.
