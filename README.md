# 🍺 Road to 5000 pintes

Application web privée de suivi de pintes pour un groupe d'amis. Objectif : atteindre 5 000 pintes ensemble.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Langage | TypeScript |
| Base de données | [Supabase](https://supabase.com/) (PostgreSQL + Storage + Realtime) |
| Auth | Cookie HTTP-only (`biere_pseudo`) |
| Style | [Tailwind CSS](https://tailwindcss.com/) |
| Carte | [Leaflet.js](https://leafletjs.com/) + OpenStreetMap / Nominatim |
| Emails | [Resend](https://resend.com/) |
| Animations | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) |
| Déploiement | [Vercel](https://vercel.com/) |
| Cron | Vercel Cron Jobs |

---

## Fonctionnalités

### Feed
- Poster une pinte avec photo (compression automatique côté client, max 1200px, 85% qualité)
- Champ bar et ville séparés avec autocomplétion depuis l'historique
- Numérotation automatique des pintes (#1, #2…)
- Suppression de ses propres posts (double confirmation)
- Feed paginé (20 posts par page)
- **Realtime** : bannière d'alerte quand un autre membre poste
- **Rate limiting** : max 10 posts par heure par utilisateur

### Compteur
- Barre de progression vers 5 000 pintes
- Mise en avant des paliers (50, 100, 250, 500, 1000, 2000, 5000)
- **Confettis** à chaque palier atteint

### Classement
- Classement hebdomadaire et all-time
- **Vote Pinte du Mois** : chaque membre vote pour sa pinte préférée du mois en cours (1 vote/mois, modifiable)

### Stats
- Pintes du jour (fenêtre 12h → 12h)
- Temps moyen entre 2 pintes par membre
- Distribution horaire des posts
- Top bar visité + top ville
- **Carte interactive** des bars visités (Leaflet, 1 pin par ville, taille proportionnelle au nombre de pintes)

### Profil
- Page `/profil/[pseudo]` : grille de photos, stats perso (pintes / bars / villes / paliers), bar favori
- Badges obtenus

### Badges

| Badge | Emoji | Condition |
|---|---|---|
| Premier post | 🥇 | 1er à avoir posté |
| Centenaire | 💯 | A posté la 100ème pinte du groupe |
| Explorateur | 📍 | Posté depuis 5 bars différents |
| Vendredi | 📅 | A posté un vendredi |
| Assidu | 🔥 | A posté 3 semaines de suite |

### Newsletter hebdomadaire
Envoi automatique chaque lundi à 9h par email à tous les membres avec :
- Classement de la semaine
- Nombre de pintes de la semaine
- Total général + progression vers 5 000
- Bar et ville les plus visités de la semaine

---

## Structure du projet

**`app/api/`**
- `auth/route.ts` — Login / logout
- `badges/route.ts` — GET badges d'un membre
- `bars/route.ts` — GET bars visités avec comptage
- `leaderboard/route.ts` — GET classement semaine / all-time
- `locations/route.ts` — GET autocomplétion bar / ville
- `newsletter/route.ts` — GET envoi newsletter (cron)
- `posts/route.ts` — GET liste paginée / POST nouveau post
- `posts/[id]/route.ts` — DELETE un post
- `stats/route.ts` — GET statistiques
- `votes/route.ts` — GET pinte du mois / POST voter

**`app/`**
- `classement/page.tsx` — Page classement + vote pinte du mois
- `login/page.tsx` — Page de connexion
- `profil/[pseudo]/page.tsx` — Page profil par membre
- `stats/page.tsx` — Page statistiques
- `page.tsx` — Feed principal

**`components/`**
- `BadgeList.tsx` — Affichage des badges
- `BarsMap.tsx` — Carte Leaflet des bars
- `Counter.tsx` — Barre de progression
- `FeedClient.tsx` — Feed realtime + confettis
- `Leaderboard.tsx` — Tableau classement
- `Navigation.tsx` — Barre de navigation
- `PinteDuMois.tsx` — Vote pinte du mois
- `PostCard.tsx` — Carte d'un post
- `PostForm.tsx` — Formulaire nouveau post
- `StatsClient.tsx` — Statistiques interactives

**`lib/`**
- `auth.ts` — Helper `getPseudo()` (cookie)
- `supabase-client.ts` — Client Supabase navigateur (Realtime)
- `supabase-server.ts` — Client Supabase serveur (service role)
- `utils.ts` — `formatDate`, `getWeekRange`…

---

## Base de données (Supabase)

### Table `posts`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| member_id | uuid | FK → members |
| pseudo | text | Pseudo du membre |
| photo_url | text | URL Supabase Storage |
| pint_number | int4 | Numéro de la pinte (global) |
| created_at | timestamptz | Date de publication |
| is_milestone | bool | Vrai si palier atteint |
| bar_name | text | Nom du bar |
| city | text | Ville |

### Table `members`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| pseudo | text | Pseudo unique |
| email | text | Email (pour newsletter) |
| password_hash | text | Hash bcrypt |

### Table `member_badges`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| pseudo | text | Pseudo du membre |
| badge | text | Identifiant du badge |
| earned_at | timestamptz | Date d'obtention |

### Table `votes_pinte_mois`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| post_id | uuid | FK → posts |
| pseudo | text | Votant |
| month | text | Format YYYY-MM |
| created_at | timestamptz | Date du vote |

### Realtime
La table `posts` a le Realtime activé (Publications dans le dashboard Supabase) pour le feed live.

---

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
COOKIE_SECRET=un_secret_long_et_aléatoire
RESEND_API_KEY=re_...
NEWSLETTER_FROM=newsletter@tondomaine.com
NEWSLETTER_TO=groupe@tondomaine.com
CRON_SECRET=un_secret_quelconque
NEXT_PUBLIC_GOAL=5000
```

---

## Installation

```bash
git clone https://github.com/ton-user/compteur-a-bieres.git
cd compteur-a-bieres
npm install
cp .env.example .env.local
npm run dev
```

---

## Déploiement (Vercel)

1. Push le code sur GitHub
2. Importe le repo sur [vercel.com](https://vercel.com)
3. Ajoute toutes les variables d'env dans **Settings → Environment Variables**
4. Deploy !

Le fichier `vercel.json` déclenche automatiquement la newsletter chaque lundi à 9h UTC via un cron job. La route `/api/newsletter` est protégée par le header `Authorization: Bearer ${CRON_SECRET}`.

---

## Authentification

Système custom sans Supabase Auth :
- Login via pseudo + mot de passe
- Cookie HTTP-only `biere_pseudo` posé par `/api/auth`
- Helper `getPseudo()` dans `lib/auth.ts` côté serveur
- Pas de JWT, pas de session Supabase

---

## Geocodage (carte)

- API Nominatim (OpenStreetMap) — gratuite, sans clé API
- Geocodage par **ville uniquement** (plus fiable que par adresse de bar)
- Cache `localStorage` (`biere_geocache_city_v1`) pour éviter les requêtes répétées
- Délai de 1100ms entre chaque requête (respect des CGU Nominatim)