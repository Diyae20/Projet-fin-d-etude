# Plan d'implémentation du Smart Triage & Real-Time Emergency Priority

## Étape 1 : Modification du modèle de données (Backend)

### 1.1 Ajouter un champ de priorité au modèle RendezVous
- Ajouter un champ `priorite` au modèle `RendezVous` avec les valeurs : "basse", "moyenne", "haute"
- Créer une migration pour ajouter ce champ à la base de données

### 1.2 Créer un modèle pour la file d'attente prioritaire
- Créer un modèle `FileAttentePrioritaire` pour gérer les patients déplacés
- Ce modèle contiendra : patient, rendez_vous_original, date_deplacement, raison, statut

## Étape 2 : Implémentation de l'algorithme de gestion des priorités (Backend)

### 2.1 Créer les fonctions de gestion des priorités
- Fonction pour trouver un créneau disponible selon la priorité (J+7 pour basse, 48-72h pour moyenne)
- Fonction pour gérer le SWAP automatique pour les urgences (priorité haute)
- Fonction pour ajouter un patient à la file d'attente prioritaire

### 2.2 Créer les endpoints API pour la gestion des priorités
- Endpoint pour créer un rendez-vous avec priorité
- Endpoint pour gérer les urgences (SWAP automatique)
- Endpoint pour consulter la file d'attente prioritaire

## Étape 3 : Implémentation du système de notification (Backend)

### 3.1 Créer le service de notification
- Service pour envoyer des SMS aux patients déplacés
- Service pour envoyer des emails de confirmation

### 3.2 Intégrer le service de notification dans l'algorithme de SWAP
- Appeler le service de notification lors d'un SWAP automatique
- Stocker l'historique des notifications envoyées

## Étape 4 : Modification de l'interface de réception (Frontend)

### 4.1 Créer l'interface de triage intelligent
- Interface pour identifier le patient (nouveau ou connu)
- Interface pour sélectionner la priorité (Vert, Jaune, Rouge)
- Affichage conditionnel selon le type de patient

### 4.2 Créer l'interface de gestion des urgences
- Interface pour visualiser les urgences en cours
- Interface pour confirmer ou annuler un SWAP automatique
- Interface pour consulter la file d'attente prioritaire

## Étape 5 : Intégration et tests

### 5.1 Intégrer les nouvelles fonctionnalités dans le dashboard de réception
- Ajouter les nouveaux composants au dashboard de réception
- Mettre à jour les services API pour utiliser les nouveaux endpoints

### 5.2 Tester l'ensemble du système
- Tests unitaires pour les fonctions de gestion des priorités
- Tests d'intégration pour l'ensemble du système
- Tests utilisateur pour l'interface de triage intelligent

## Étape 6 : Documentation

### 6.1 Documenter le code
- Ajouter des commentaires explicatifs dans le code
- Créer une documentation technique pour les développeurs

### 6.2 Créer un guide utilisateur
- Guide pour la réception sur l'utilisation du système de triage
- Guide pour les patients sur la gestion des urgences
