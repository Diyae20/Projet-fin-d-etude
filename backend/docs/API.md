# Documentation de l'API

## Introduction

Cette documentation décrit les endpoints de l'API RESTful de l'application de gestion de rendez-vous médicaux. L'API utilise le format JSON pour les requêtes et les réponses.

## Authentification

Toutes les requêtes, sauf celles pour l'inscription et la connexion, doivent inclure un en-tête `Authorization` avec le token d'authentification :

```
Authorization: Token <votre-token>
```

## Format des Réponses

### Réponse réussie

```json
{
    "id": 1,
    "field1": "value1",
    "field2": "value2"
}
```

### Réponse d'erreur

```json
{
    "detail": "Message d'erreur"
}
```

### Réponse de validation

```json
{
    "field1": ["Erreur de validation pour field1"],
    "field2": ["Erreur de validation pour field2"]
}
```

## Endpoints

### Authentification

#### Inscription

Crée un nouvel utilisateur.

**Endpoint** : `POST /api/auth/register/`

**Corps de la requête** :
```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "1234567890",
    "role": "patient"
}
```

**Réponse** : `201 Created`
```json
{
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "1234567890",
    "role": "patient"
}
```

#### Connexion

Connecte un utilisateur et renvoie un token d'authentification.

**Endpoint** : `POST /api/auth/login/`

**Corps de la requête** :
```json
{
    "username": "johndoe",
    "password": "securepassword123"
}
```

**Réponse** : `200 OK`
```json
{
    "token": "abc123def456ghi789",
    "user_id": 1,
    "username": "johndoe",
    "role": "patient"
}
```

#### Déconnexion

Déconnecte un utilisateur et révoque son token.

**Endpoint** : `POST /api/auth/logout/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Réponse** : `200 OK`
```json
{
    "detail": "Déconnexion réussie"
}
```

### Utilisateurs

#### Liste des utilisateurs

Récupère la liste des utilisateurs.

**Endpoint** : `GET /api/users/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Paramètres de requête** :
- `page` : Numéro de page (défaut: 1)
- `page_size` : Nombre d'éléments par page (défaut: 10)
- `search` : Recherche par nom d'utilisateur, email ou nom complet
- `role` : Filtrer par rôle (patient, medecin, reception, admin)

**Réponse** : `200 OK`
```json
{
    "count": 100,
    "next": "http://example.com/api/users/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "username": "johndoe",
            "email": "john@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "1234567890",
            "role": "patient"
        }
    ]
}
```

#### Détails d'un utilisateur

Récupère les détails d'un utilisateur spécifique.

**Endpoint** : `GET /api/users/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Réponse** : `200 OK`
```json
{
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "1234567890",
    "role": "patient",
    "is_reception": false,
    "is_admin": false,
    "date_joined": "2023-01-01T00:00:00Z"
}
```

#### Créer un utilisateur

Crée un nouvel utilisateur.

**Endpoint** : `POST /api/users/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Corps de la requête** :
```json
{
    "username": "janedoe",
    "email": "jane@example.com",
    "password": "securepassword123",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone": "0987654321",
    "role": "patient"
}
```

**Réponse** : `201 Created`
```json
{
    "id": 2,
    "username": "janedoe",
    "email": "jane@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone": "0987654321",
    "role": "patient"
}
```

#### Mettre à jour un utilisateur

Met à jour les informations d'un utilisateur.

**Endpoint** : `PUT /api/users/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Corps de la requête** :
```json
{
    "username": "janedoe",
    "email": "jane.new@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "0987654321",
    "role": "patient"
}
```

**Réponse** : `200 OK`
```json
{
    "id": 2,
    "username": "janedoe",
    "email": "jane.new@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "0987654321",
    "role": "patient"
}
```

#### Supprimer un utilisateur

Supprime un utilisateur.

**Endpoint** : `DELETE /api/users/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Réponse** : `204 No Content`

### Médecins

#### Liste des médecins

Récupère la liste des médecins.

**Endpoint** : `GET /api/medecins/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Paramètres de requête** :
- `page` : Numéro de page (défaut: 1)
- `page_size` : Nombre d'éléments par page (défaut: 10)
- `search` : Recherche par nom, spécialité ou ville
- `ville` : Filtrer par ville

**Réponse** : `200 OK`
```json
{
    "count": 50,
    "next": "http://example.com/api/medecins/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "user": {
                "id": 3,
                "username": "drsmith",
                "email": "smith@example.com",
                "first_name": "Robert",
                "last_name": "Smith"
            },
            "bio": "Médecin généraliste avec 15 ans d'expérience",
            "adresse_cabinet": "123 Rue de la Santé",
            "telephone": "1234567890",
            "ville": "Paris",
            "duree_consultation": 30,
            "max_patients_par_jour": 20
        }
    ]
}
```

#### Détails d'un médecin

Récupère les détails d'un médecin spécifique.

**Endpoint** : `GET /api/medecins/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Réponse** : `200 OK`
```json
{
    "id": 1,
    "user": {
        "id": 3,
        "username": "drsmith",
        "email": "smith@example.com",
        "first_name": "Robert",
        "last_name": "Smith"
    },
    "bio": "Médecin généraliste avec 15 ans d'expérience",
    "adresse_cabinet": "123 Rue de la Santé",
    "telephone": "1234567890",
    "ville": "Paris",
    "duree_consultation": 30,
    "max_patients_par_jour": 20,
    "rendezvous": [
        {
            "id": 1,
            "date": "2023-12-01",
            "heure": "09:00:00",
            "statut": "confirme",
            "patient": {
                "id": 1,
                "username": "johndoe",
                "first_name": "John",
                "last_name": "Doe"
            }
        }
    ]
}
```

#### Créer un médecin

Crée un nouveau médecin.

**Endpoint** : `POST /api/medecins/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Corps de la requête** :
```json
{
    "username": "drjones",
    "email": "jones@example.com",
    "password": "securepassword123",
    "first_name": "Sarah",
    "last_name": "Jones",
    "phone": "0987654321",
    "bio": "Médecin spécialiste en cardiologie",
    "adresse_cabinet": "456 Avenue de la Médecine",
    "telephone": "0987654321",
    "ville": "Lyon",
    "duree_consultation": 45,
    "max_patients_par_jour": 15
}
```

**Réponse** : `201 Created`
```json
{
    "id": 2,
    "user": {
        "id": 4,
        "username": "drjones",
        "email": "jones@example.com",
        "first_name": "Sarah",
        "last_name": "Jones"
    },
    "bio": "Médecin spécialiste en cardiologie",
    "adresse_cabinet": "456 Avenue de la Médecine",
    "telephone": "0987654321",
    "ville": "Lyon",
    "duree_consultation": 45,
    "max_patients_par_jour": 15
}
```

#### Mettre à jour un médecin

Met à jour les informations d'un médecin.

**Endpoint** : `PUT /api/medecins/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Corps de la requête** :
```json
{
    "bio": "Médecin spécialiste en cardiologie avec 10 ans d'expérience",
    "adresse_cabinet": "789 Boulevard de la Santé",
    "telephone": "0987654321",
    "ville": "Lyon",
    "duree_consultation": 45,
    "max_patients_par_jour": 15
}
```

**Réponse** : `200 OK`
```json
{
    "id": 2,
    "user": {
        "id": 4,
        "username": "drjones",
        "email": "jones@example.com",
        "first_name": "Sarah",
        "last_name": "Jones"
    },
    "bio": "Médecin spécialiste en cardiologie avec 10 ans d'expérience",
    "adresse_cabinet": "789 Boulevard de la Santé",
    "telephone": "0987654321",
    "ville": "Lyon",
    "duree_consultation": 45,
    "max_patients_par_jour": 15
}
```

#### Supprimer un médecin

Supprime un médecin.

**Endpoint** : `DELETE /api/medecins/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Réponse** : `204 No Content`

### Rendez-vous

#### Liste des rendez-vous

Récupère la liste des rendez-vous.

**Endpoint** : `GET /api/rendezvous/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Paramètres de requête** :
- `page` : Numéro de page (défaut: 1)
- `page_size` : Nombre d'éléments par page (défaut: 10)
- `patient_id` : Filtrer par patient
- `medecin_id` : Filtrer par médecin
- `date` : Filtrer par date
- `statut` : Filtrer par statut (confirme, annule, passe, en_attente)

**Réponse** : `200 OK`
```json
{
    "count": 200,
    "next": "http://example.com/api/rendezvous/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "patient": {
                "id": 1,
                "username": "johndoe",
                "first_name": "John",
                "last_name": "Doe"
            },
            "medecin": {
                "id": 3,
                "username": "drsmith",
                "first_name": "Robert",
                "last_name": "Smith"
            },
            "date": "2023-12-01",
            "heure": "09:00:00",
            "statut": "confirme",
            "statut_display": "Confirmé",
            "motif": "Consultation générale",
            "notes": "",
            "cree_le": "2023-11-01T10:00:00Z",
            "modifie_le": "2023-11-01T10:00:00Z"
        }
    ]
}
```

#### Détails d'un rendez-vous

Récupère les détails d'un rendez-vous spécifique.

**Endpoint** : `GET /api/rendezvous/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Réponse** : `200 OK`
```json
{
    "id": 1,
    "patient": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "1234567890"
    },
    "medecin": {
        "id": 3,
        "username": "drsmith",
        "email": "smith@example.com",
        "first_name": "Robert",
        "last_name": "Smith"
    },
    "date": "2023-12-01",
    "heure": "09:00:00",
    "statut": "confirme",
    "statut_display": "Confirmé",
    "motif": "Consultation générale",
    "notes": "",
    "cree_le": "2023-11-01T10:00:00Z",
    "modifie_le": "2023-11-01T10:00:00Z"
}
```

#### Créer un rendez-vous

Crée un nouveau rendez-vous.

**Endpoint** : `POST /api/rendezvous/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Corps de la requête** :
```json
{
    "patient_id": 1,
    "medecin_id": 3,
    "date": "2023-12-01",
    "heure": "09:00:00",
    "motif": "Consultation générale"
}
```

**Réponse** : `201 Created`
```json
{
    "id": 2,
    "patient": {
        "id": 1,
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe"
    },
    "medecin": {
        "id": 3,
        "username": "drsmith",
        "first_name": "Robert",
        "last_name": "Smith"
    },
    "date": "2023-12-01",
    "heure": "09:00:00",
    "statut": "en_attente",
    "statut_display": "En attente",
    "motif": "Consultation générale",
    "notes": "",
    "cree_le": "2023-11-01T10:00:00Z",
    "modifie_le": "2023-11-01T10:00:00Z"
}
```

#### Mettre à jour un rendez-vous

Met à jour les informations d'un rendez-vous.

**Endpoint** : `PUT /api/rendezvous/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Corps de la requête** :
```json
{
    "statut": "confirme",
    "notes": "Patient à l'heure, consultation normale"
}
```

**Réponse** : `200 OK`
```json
{
    "id": 2,
    "patient": {
        "id": 1,
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe"
    },
    "medecin": {
        "id": 3,
        "username": "drsmith",
        "first_name": "Robert",
        "last_name": "Smith"
    },
    "date": "2023-12-01",
    "heure": "09:00:00",
    "statut": "confirme",
    "statut_display": "Confirmé",
    "motif": "Consultation générale",
    "notes": "Patient à l'heure, consultation normale",
    "cree_le": "2023-11-01T10:00:00Z",
    "modifie_le": "2023-11-01T10:05:00Z"
}
```

#### Supprimer un rendez-vous

Supprime un rendez-vous.

**Endpoint** : `DELETE /api/rendezvous/{id}/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Réponse** : `204 No Content`

### Réception

#### Tableau de bord de la réception

Récupère les statistiques pour le tableau de bord de la réception.

**Endpoint** : `GET /api/reception/dashboard/`

**En-têtes** :
```
Authorization: Token <votre-token>
```

**Réponse** : `200 OK`
```json
{
    "total_patients": 150,
    "total_medecins": 20,
    "total_rendezvous": 500,
    "rendezvous_en_attente": 30,
    "rendezvous_confirmes": 400,
    "rendezvous_annules": 50,
    "rendezvous_passe": 20,
    "rendezvous_aujourdhui": 15
}
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 OK | Requête réussie |
| 201 Created | Ressource créée avec succès |
| 204 No Content | Requête réussie, pas de contenu à renvoyer |
| 400 Bad Request | Requête mal formée ou données invalides |
| 401 Unauthorized | Authentification requise ou échec de l'authentification |
| 403 Forbidden | L'utilisateur n'a pas les droits nécessaires |
| 404 Not Found | Ressource non trouvée |
| 409 Conflict | Conflit avec l'état actuel de la ressource |
| 500 Internal Server Error | Erreur interne du serveur |

## Limites de l'API

- Nombre maximum de résultats par page : 100
- Taille maximale d'une requête : 10 MB
- Taux de requêtes : 1000 requêtes par heure par utilisateur

## Version de l'API

La version actuelle de l'API est v1.0.0.
