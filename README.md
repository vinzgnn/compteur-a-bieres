# 🍺 Road to 5000 Pintes

Application web pour tracker les pintes du groupe.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** (base de données PostgreSQL + stockage photos)
- **Resend** (newsletter hebdomadaire)
- **Vercel** (hébergement + cron job newsletter)
- **Tailwind CSS**

---

## Installation

```bash
npm install
```

Copie `.env.example` en `.env.local` et remplis les variables.

---

## Setup Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** et exécute le fichier `supabase/schema.sql`
3. Va dans **Storage** → crée un bucket `pints` → coche **Public bucket**
4. Récupère tes clés dans **Settings → API** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## Setup Resend (newsletter)

1. Crée un compte sur [resend.com](https://resend.com) (gratuit jusqu'à 3000 emails/mois)
2. Ajoute ton domaine ou utilise `onboarding@resend.dev` pour tester
3. Récupère ta clé API → `RESEND_API_KEY`
4. Remplis `RESEND_FROM_EMAIL` avec l'adresse d'envoi

---

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx

INVITE_CODE=biere2024          # Code secret à partager avec les amis
NEXT_PUBLIC_GOAL=5000          # Objectif de pintes

RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=newsletter@tondomaine.com

CRON_SECRET=un_truc_long_et_random   # Protège la route /api/newsletter
```

---

## Déploiement sur Vercel

1. Push le code sur GitHub
2. Importe le repo sur [vercel.com](https://vercel.com)
3. Ajoute toutes les variables d'env dans **Settings → Environment Variables**
4. Deploy !

Le cron job `vercel.json` enverra automatiquement la newsletter chaque lundi à 8h UTC.

---

## Fonctionnalités

- **Feed** : photos des pintes avec lieu, pseudo et numéro de pinte
- **Compteur** : barre de progression vers l'objectif
- **Upload** : photo depuis la galerie ou l'appareil photo
- **Classement** : global + hebdomadaire
- **Newsletter** : email automatique chaque lundi avec le récap de la semaine

---

## Dev local

```bash
npm run dev
```

Pour tester la newsletter manuellement :
```bash
curl -H "Authorization: Bearer TON_CRON_SECRET" http://localhost:3000/api/newsletter
```
