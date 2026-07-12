#!/bin/sh
# seed.sh — peuple Redis avec les structures représentatives du projet
# Exécuté par le conteneur jetable "redis-seed" une fois redis prêt

REDIS="redis-cli -h redis -a fablab_redis_pass"

echo "=== Statuts machines (clé-valeur simple) ==="
$REDIS SET machine:1:statut "disponible"
$REDIS SET machine:2:statut "disponible"
$REDIS SET machine:3:statut "disponible"
$REDIS SET machine:4:statut "disponible"
$REDIS SET machine:5:statut "maintenance"

echo "=== Réservation imprimante avec délai de confirmation (TTL 20 min) ==="
# Quand un client clique "Réserver" sur une machine instantanée :
# la clé expire automatiquement après 1200s si rien n'est confirmé
$REDIS SET reservation:pending:machine:1 "client:6" EX 1200
$REDIS SET machine:1:statut "reserve"

echo "=== Compteurs de places fablab en temps réel (X/12) ==="
$REDIS SET magasin:1:occupation 4
$REDIS SET magasin:1:capacite 12
$REDIS SET magasin:2:occupation 2
$REDIS SET magasin:2:capacite 8

echo "=== Liste nominative des présents dans un magasin (pour affichage commerçant) ==="
$REDIS HSET magasin:1:presents "client:4" "Imprimante 3D BIBI"
$REDIS HSET magasin:1:presents "client:5" "Poste a souder STATION-1"

echo "=== Sessions de connexion (TTL 2h) ==="
$REDIS SET session:abc123 "user:4" EX 7200
$REDIS SET session:def456 "user:2" EX 7200

echo "=== Liste d'attente sur une machine occupée ==="
$REDIS RPUSH waitlist:machine:1 "client:6"

echo "=== Score de fiabilité client (sorted set : moins d'annulations = mieux classé) ==="
$REDIS ZADD reliability_score 0 "client:4"
$REDIS ZADD reliability_score 1 "client:5"
$REDIS ZADD reliability_score 3 "client:6"

echo "Seed Redis terminé."
