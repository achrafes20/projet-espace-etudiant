# Espace Étudiant – Gestion des Services

Plateforme web pour centraliser les demandes administratives des étudiants (attestations, relevés, conventions) et le traitement côté administration. Le projet couvre la saisie en ligne, le suivi, les notifications email et un tableau de bord complet.

---

## Aperçu rapide
- **Documents gérés** : Attestation de scolarité, Attestation de réussite, Relevé de notes, Convention de stage
- **Rôles** : Étudiant (demande, suivi, réclamation) et Administrateur (validation, génération PDF, réponses)
- **Référence unique** : `[TYPE]-[ANNÉE]-[N°]` ex. `AS-2025-001`, `RN-2025-123`
- **Statuts** : En attente · Accepté · Refusé (avec motif)
- **Notifications** : Emails automatiques à chaque étape (confirmation, validation avec pièce jointe, refus, réponse à réclamation)

---

## Fonctionnalités clés

### Pour les étudiants
- Validation instantanée (Email + Apogée + CIN)
- Formulaires adaptés au type de document
- Référence unique + confirmation email
- Suivi de statut et dépôt de réclamation

### Pour l’administration
- Authentification sécurisée + JWT
- Traitement des demandes (acceptation avec PDF ou refus motivé)
- Gestion des réclamations et envoi de réponses
- Tableau de bord : volumes, statuts, filtres (date, type, statut, recherche)
- Export et historique complet des actions

### Règles métier et livrables
- Un seul original par demande validée (photocopies à la charge de l’étudiant)
- Formulaire spécifique après validation des identifiants
- Journalisation des actions et aucune fuite d’information en cas d’erreur

---

## Parcours d’une demande
1. **Vérification d’identité** : Email + Numéro Apogée + CIN
2. **Formulaire dédié** : Champs propres au document (année académique, session, entreprise…)
3. **Confirmation** : Référence affichée + email automatique
4. **Traitement admin** : Acceptation (envoi PDF joint) ou refus (motif détaillé)
5. **Réclamation** : Numéro dédié et réponse email personnalisée

---

## Lancement express (dev)

### Prérequis
- Node.js et npm
- MySQL en cours d’exécution

### 1) Backend (dossier racine)
```bash
# Dépendances
npm install

# Variables d’environnement
copy server\.env.example server\.env   # Windows
cp server/.env.example server/.env     # macOS/Linux

# Importer le schéma
mysql -u root -p < projet_db.sql       # ou via phpMyAdmin

# (Optionnel) pré-remplir la base avec comptes/étudiants
npm run seed

# Lancer l’API
npm start
# API dispo sur http://localhost:5000
```

Variables importantes (`server/.env`) :
- `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS` (pour l’envoi d’emails)

### 2) Frontend (dossier `client`)
```bash
cd client
npm install
npm run dev
# Front dispo sur http://localhost:5173
```

### Accès admin par défaut
- Email : `admin@university.edu`
- Mot de passe : `admin123`

---

## Structure et données
- Base MySQL : tables `students`, `requests`, `complaints`, `administrators`, `action_history`, `email_notifications`
- Données spécifiques par document stockées en JSON (année, session, entreprise, modules…)
- Script `npm run seed` : crée un admin et des jeux d’essai étudiants/demandes/réclamations

---

## Design et expérience
- Interface moderne et épurée adaptée aux usages académiques
- Navigation claire étudiant/admin, feedback visuel (états, notifications)
- Responsive desktop/mobile, contrastes lisibles et branding université
- Dashboard avec graphiques (type et statut) et filtres rapides

---

## Pistes d’évolution
- Ajout de tests automatisés
- Génération avancée de PDF (modèles brandés)
- Webhooks de suivi ou notifications SMS
- Internationalisation FR/EN
