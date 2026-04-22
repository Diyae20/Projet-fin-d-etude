# Guide de synchronisation de la base de données

## Problème
Vous avez développé votre projet sur un ordinateur portable avec des utilisateurs existants, mais après avoir synchronisé avec GitHub et cloné sur votre PC de bureau, les utilisateurs n'existent plus.

## Explication
GitHub ne synchronise pas les fichiers de base de données (comme db.sqlite3), seulement le code source. C'est pourquoi vos utilisateurs créés sur votre portable ne sont pas disponibles sur votre PC de bureau.

## Solutions

### Option 1: Créer de nouveaux utilisateurs de test (Recommandé)

Exécutez la commande suivante pour créer des utilisateurs de test sur votre PC de bureau:

```bash
cd backend
python manage.py create_test_users
```

Cela créera les utilisateurs suivants:
- Admin: username `admin`, password `admin123`
- Médecin: username `medecin1`, password `medecin123`
- Réceptionniste: username `reception1`, password `reception123`
- Patient: username `patient1`, password `patient123`

### Option 2: Copier la base de données depuis votre portable

Si vous avez besoin de conserver exactement les mêmes données:

1. Sur votre ordinateur portable, localisez le fichier `db.sqlite3` dans le dossier backend
2. Copiez ce fichier
3. Sur votre PC de bureau, remplacez le fichier `db.sqlite3` existant par celui de votre portable
4. Assurez-vous que les migrations sont à jour sur les deux machines:
   ```bash
   python manage.py migrate
   ```

### Option 3: Utiliser un système de sauvegarde de données

Pour éviter ce problème à l'avenir, vous pouvez:

1. Exporter vos données depuis votre portable:
   ```bash
   python manage.py dumpdata > backup.json
   ```

2. Ajouter `backup.json` à votre dépôt GitHub (ou le stocker ailleurs)

3. Sur votre PC de bureau, importer les données:
   ```bash
   python manage.py loaddata backup.json
   ```

### Option 4: Utiliser une base de données partagée (Pour la production)

Pour éviter ce problème en production, utilisez une base de données hébergée (comme PostgreSQL sur un serveur ou un service cloud) au lieu de SQLite.

Modifiez votre fichier `.env` pour inclure:
```
DATABASE_URL=postgresql://user:password@host:port/database_name
```

## Recommandation

Pour le développement, je recommande l'Option 1 (créer de nouveaux utilisateurs de test) car:
- C'est rapide et simple
- Vous pouvez créer des utilisateurs spécifiques pour chaque environnement de développement
- Cela évite les conflits de données entre les machines

Pour la production, utilisez l'Option 4 (base de données partagée) pour que tous les environnements utilisent les mêmes données.