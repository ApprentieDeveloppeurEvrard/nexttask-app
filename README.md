# 📋 NextTask – Application de gestion de tâches

**NextTask** est une application web de gestion de tâches personnelles construite avec **Next.js 14**, **TypeScript**, **Tailwind CSS** et **Prisma**.  
Elle permet à chaque utilisateur de gérer ses tâches via une interface fluide, sécurisée et responsive.

---

## 🚀 Fonctionnalités principales

- ✅ Création de compte (email + mot de passe)
- 🔐 Connexion et déconnexion sécurisées
- 📄 Ajout, modification et suppression de tâches
- 🧮 Statistiques des tâches (accomplies / non accomplies)
- 📅 Historique et filtres par date / statut
- 🔍 Tri des tâches par date ou par état
- 📦 Stockage en base relationnelle (SQLite)

---

## 🛠️ Stack technique

| Élément              | Choix                                |
|----------------------|---------------------------------------|
| Framework            | Next.js 14 (App Router)              |
| Langage              | TypeScript                           |
| UI                   | Tailwind CSS                         |
| ORM                  | Prisma                               |
| Base de données      | SQLite 
| Authentification     | Auth maison ou NextAuth.js           |
| API                  | API Routes ou Server Actions         |

---

## 📁 Structure du projet
nexttask-app/
├── app/ # Pages via App Router
├── components/ # Composants UI réutilisables
├── prisma/ # Schéma de la base + migrations
├── lib/ # Fonctions helpers (DB, auth)
├── middleware.ts # Middleware pour les routes protégées
├── auth/ # Config NextAuth (si utilisé)
└── README.md # Ce fichier
