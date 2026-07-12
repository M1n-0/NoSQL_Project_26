# FabLab Manager

Application de gestion de FabLabs (réservation de machines, gestion des magasins, comptes utilisateurs) construite comme démonstrateur de **persistance polyglotte** : chaque base de données est utilisée pour ce qu'elle fait de mieux.

Projet réalisé dans le cadre du cours NoSQL — Ynov B3.

## Stack technique

| Composant | Rôle | Usage dans le projet |
|---|---|---|
| **MariaDB** (SQL) | Données relationnelles, intégrité forte | Comptes, magasins, machines, réservations, groupes |
| **MongoDB** | Documents à schéma variable | Fiches détaillées des machines/magasins (specs, photos, descriptions) |
| **Redis** | Clé-valeur, TTL, temps réel | Statuts machines, occupation des magasins, sessions, files d'attente, scores de fiabilité |
| **Neo4j** | Graphe | Réseau de fréquentation entre clients, recommandations de machines |
| **Node.js / Express** | API backend | Sert l'API REST et le frontend statique |
| **HTML / CSS / JS vanilla** | Frontend | Interfaces client, commerçant, admin |

Le tout est orchestré via **Docker Compose**.

## Architecture

```
backend/
  config/        # connexions aux 4 bases (sql, mongo, redis, neo4j)
  middleware/     # auth JWT (requireAuth, requireRole)
  routes/         # auth, shops, machines, reservations, graph, users, admin
  mariadb/init/   # schéma + seed SQL (exécutés au 1er démarrage du conteneur)
  mongo/init/     # seed MongoDB
  neo4j/init/     # seed Cypher
  redis/          # script de seed Redis
  server.js       # point d'entrée Express
frontend/
  pages/          # login, client, commercant, admin
  js/, css/       # logique et style par page
docker-compose.yml
```

## Démarrage

```bash
git clone https://github.com/M1n-0/NoSQL_Project_26.git
cd NoSQL_Project_26
docker compose up --build
```

L'API et le frontend sont servis sur **http://localhost:3000** (redirige vers `/pages/login.html`).

Services exposés :
- `3000` : API / frontend
- `3306` : MariaDB
- `27017` : MongoDB
- `6379` : Redis
- `7474` / `7687` : Neo4j (interface web / Bolt)

Les seeds (SQL, Mongo, Redis, Neo4j) sont injectés automatiquement au premier lancement via des conteneurs dédiés (`redis-seed`, `neo4j-seed`) ou des scripts `docker-entrypoint-initdb.d`.

### Comptes de démo

Mot de passe pour tous les comptes seedés : `password123`

| Rôle | Email |
|---|---|
| admin | admin@fablab.io |
| commerçant | fablab.bx@fablab.io |
| commerçant | fablab.lh@fablab.io |
| client | tom.martin@mail.io |

### Développement local (sans Docker)

```bash
cd backend
cp .env.example .env   # adapter les hosts en "localhost"
npm install
npm run dev             # nodemon
```

Nécessite les 4 bases lancées séparément (ou via `docker compose up mariadb mongo redis neo4j`).

## API

Authentification : `POST /api/auth/login` renvoie un JWT (`Authorization: Bearer <token>`), valable 8h. Toutes les routes sous `/api/*` (hors `/api/auth`) exigent ce token ; certaines exigent en plus un rôle (`client`, `commercant`, `admin`).

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Connexion |
| GET | `/api/users/me` | authentifié | Profil courant |
| PATCH | `/api/users/me` | authentifié | Modifier email / mot de passe |
| GET | `/api/shops` | authentifié | Liste des magasins + occupation live |
| GET | `/api/shops/mine` | client | Magasins associés au client |
| GET | `/api/shops/me` | commerçant | Fiche du magasin du commerçant |
| PATCH | `/api/shops/me` | commerçant | Mise à jour du magasin |
| GET | `/api/shops/me/occupancy` | commerçant | Occupation temps réel + qui réserve quoi |
| POST | `/api/shops/:id/seat` | client | Prendre une place |
| POST | `/api/shops/:id/reserve-online` | client | Réservation en ligne (hors horaires/complet) |
| GET | `/api/machines?shopId=` | authentifié | Machines d'un magasin |
| GET | `/api/machines/me` | commerçant | Machines du magasin du commerçant |
| POST | `/api/machines` | commerçant | Ajouter une machine |
| PATCH | `/api/machines/:id/status` | commerçant | Changer le statut (disponible/maintenance) |
| POST | `/api/machines/:id/reserve` | client | Réservation instantanée (TTL 20 min) |
| GET | `/api/reservations/me` | client | Réservation active |
| GET | `/api/reservations/me/history` | client | Historique client |
| GET | `/api/reservations/shop/history` | commerçant | Historique du magasin |
| PATCH | `/api/reservations/:id/status` | commerçant | Valider / terminer / annuler |
| PATCH | `/api/reservations/:id/duration` | client | Renseigner la durée d'impression |
| GET | `/api/graph/recommendations` | client | Machines recommandées (Neo4j) |
| GET | `/api/graph/network` | client | Clients croisés en fablab (Neo4j) |
| GET | `/api/admin/users` | admin | Liste des comptes |
| POST | `/api/admin/users` | admin | Créer un compte |
| DELETE | `/api/admin/users/:id` | admin | Supprimer un compte |
| GET/POST | `/api/admin/groups` | admin | Groupes |
| POST | `/api/admin/groups/:id/members` | admin | Ajouter un membre à un groupe |
| GET | `/api/admin/shops` | admin | Magasins + associations |
| POST | `/api/admin/shops/:id/link` | admin | Lier un magasin à un compte/groupe |

## Pourquoi 4 bases ?

- **SQL** garde l'intégrité des données critiques (comptes, réservations, clés étrangères).
- **MongoDB** stocke les fiches enrichies à structure hétérogène (une imprimante 3D et une CNC n'ont pas les mêmes attributs), sans lien de clé étrangère physique avec le SQL — juste un `id_machine`/`id_magasin` logique.
- **Redis** gère tout ce qui est éphémère ou temps réel : statut machine avec expiration automatique (20 min), compteur d'occupation, sessions, files d'attente, scores de fiabilité (sorted set).
- **Neo4j** modélise les relations (client-machine, client-magasin) pour les recommandations et le réseau de fréquentation, requêtes naturellement graphes.

