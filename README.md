# 🧺 Vision Pressing — Service de Pressing & Blanchisserie Haut de Gamme

> **Vision Pressing** est une application web moderne et élégante dédiée aux services de pressing, blanchisserie et soin du textile. Elle propose un parcours client fluide allant du calcul de devis interactif au suivi en temps réel des commandes, couplé à un back-office d'administration complet.

---

## 🚀 Fonctionnalités Principales

### 👤 Espace Client
- **Calculateur de Devis & Réservation (`/devis`)** : Estimation en temps réel selon les articles (chemises, costumes, robes, couettes, etc.) et choix des zones de collecte / livraison.
- **Suivi en Temps Réel (`/suivi`)** : Consultation instantanée de l'avancement d'une commande grâce à un code de tracking unique (Collecté ➔ Lavage / Repassage ➔ Prêt ➔ En livraison ➔ Livré).
- **Espace Personnel (`/compte`)** : Historique des commandes, détails du profil et adresses enregistrées.
- **Galerie Avant / Après (`/galerie`)** : Comparatif visuel interactif illustrant la qualité des traitements de nettoyage.
- **Avis & Témoignages (`/avis`)** : Consultation et possibilité pour les clients authentifiés de déposer leur avis.
- **Contact & Support (`/contact`)** : Formulaire de contact direct enregistré en base de données.
- **Présentation & Services (`/services`, `/apropos`)** : Catalogue des prestations et engagements écologiques.

### 🛡️ Dashboard Administration (`/admin`)
- **Gestion des Commandes** : Filtrage par statut, mise à jour des étapes de traitement et détails complets de la commande.
- **Gestion des Clients** : Consultation et administration des comptes utilisateurs.
- **Gestion des Zones de Livraison** : Configuration dynamique des frais de collecte et de livraison par secteur.
- **Modération & Galerie** : Ajout/Suppression des photos Avant/Après dans le bucket Storage Supabase et modération des avis clients.
- **Messagerie** : Consultation et gestion des messages reçus via le formulaire de contact.

---

## 🛠️ Stack Technique

### **Frontend**
- **Framework** : [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routage** : [Wouter](https://github.com/molefrog/wouter) (avec Lazy Loading & Suspense)
- **UI & Animations** : [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Visualisation de données** : [Recharts](https://recharts.org/)

### **Backend & Base de données**
- **BaaS** : [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentification** : Supabase Auth (Email / Mot de passe)
- **Sécurité** : Row Level Security (RLS) appliquée sur l'ensemble des tables
- **Storage** : Supabase Storage (Bucket public `gallery` pour les paires d'images Avant/Après)

---

## 📁 Structure du Projet

```text
Vision-Pressing/
├── public/                 # Assets statiques et favicons
├── src/
│   ├── components/         # Composants UI et éléments réutilisables
│   ├── hooks/              # Hooks personnalisés React
│   ├── lib/                # Configuration Supabase, Contexte Auth & Mock Data
│   │   ├── auth.jsx        # Contexte d'authentification React
│   │   ├── supabase.js     # Initialisation du client Supabase
│   │   └── data.js         # Données statiques / fallbacks
│   ├── pages/              # Vues principales de l'application
│   │   ├── Home.jsx        # Page d'accueil
│   │   ├── Services.jsx    # Catalogue de services
│   │   ├── Quote.jsx       # Calculateur de devis & commande
│   │   ├── Tracking.jsx    # Suivi de commande
│   │   ├── Account.jsx     # Espace client
│   │   ├── Gallery.jsx     # Galerie Avant/Après
│   │   ├── Admin.jsx       # Back-office administration
│   │   ├── Login.jsx       # Connexion & Inscription
│   │   ├── Reviews.jsx     # Avis clients
│   │   ├── Contact.jsx     # Formulaire de contact
│   │   └── About.jsx       # À propos de l'entreprise
│   ├── App.jsx             # Configuration des routes (Wouter)
│   ├── main.jsx            # Point d'entrée de l'application
│   └── index.css           # Thème global, styles Tailwind et variables CSS
├── supabase-setup.sql      # Script SQL de création des tables, RLS et buckets
├── vite.config.js          # Configuration du bundler Vite
├── vercel.json             # Configuration pour le déploiement Vercel
└── package.json            # Dépendances et scripts du projet
```

---

## ⚡ Installation & Démarrage Rapide

### 1. Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- Un compte [Supabase](https://supabase.com/)

### 2. Cloner le projet & Installer les dépendances
```bash
git clone <URL_DU_REPO>
cd Vision-Pressing
npm install
```

### 3. Variables d'environnement
Créez un fichier `.env.local` à la racine du projet avec vos identifiants Supabase :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-supabase
```

### 4. Configuration de la base de données Supabase
1. Rendez-vous dans votre **Supabase Dashboard** > **SQL Editor**.
2. Exécutez le script SQL contenu dans le fichier [`supabase-setup.sql`](file:///c:/Users/Omnibook/Desktop/Vision-Pressing/supabase-setup.sql).
3. Allez dans **Storage** > **New Bucket** et créez un bucket nommé **`gallery`** (cochez l'option *Public bucket*).

### 5. Lancer l'application en mode développement
```bash
npm run dev
```
L'application sera accessible à l'adresse `http://localhost:5173` (ou l'adresse IP locale affichée dans votre terminal).

---

## 📦 Scripts Disponibles

- `npm run dev` : Lance le serveur de développement Vite (accessible sur le réseau local `--host 0.0.0.0`).
- `npm run build` : Compile le projet pour la production dans le dossier `dist/`.
- `npm run serve` : Prévisualise le build de production localement.

---

## 🌐 Déploiement

Le projet contient un fichier `vercel.json` optimisé pour un déploiement instantané sur **[Vercel](https://vercel.com/)** :

1. Connectez votre dépôt GitHub à Vercel.
2. Ajoutez les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les paramètres de votre projet Vercel.
3. Déployez !

---

## 📄 Licence

Ce projet est sous licence privée. Tous droits réservés — **Vision Pressing**.
