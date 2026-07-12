// seed.cypher — peuple Neo4j avec le graphe de démonstration
// Exécuté par le conteneur jetable "neo4j-seed" via cypher-shell

// Nettoyage (utile si on relance le seed)
MATCH (n) DETACH DELETE n;

// --- Noeuds Client (id_client fait le lien logique avec la table SQL users) ---
CREATE (erik:Client {id_client: 4, nom: "Erik Lebus"});
CREATE (tom:Client    {id_client: 5, nom: "Tom Martin"});
CREATE (nino:Client   {id_client: 6, nom: "Nino Le Bot"});

// --- Noeuds Machine (id_machine fait le lien logique avec SQL + Mongo) ---
CREATE (bibi:Machine   {id_machine: 1, nom: "Imprimante 3D BIBI",       type: "imprimante_3d"});
CREATE (alpha:Machine  {id_machine: 2, nom: "Decoupeuse laser ALPHA",   type: "decoupeuse_laser"});
CREATE (station:Machine{id_machine: 3, nom: "Poste a souder STATION-1", type: "poste_soudure"});
CREATE (echo:Machine   {id_machine: 4, nom: "Imprimante 3D ECHO",       type: "imprimante_3d"});

// --- Noeuds Magasin ---
CREATE (mag1:Magasin {id_magasin: 1, nom: "FabLab Bordeaux Centre"});
CREATE (mag2:Magasin {id_magasin: 2, nom: "FabLab Le Haillan"});

// --- Relations HABILITE_SUR : qui a été formé sur quelle machine ---
MATCH (erik:Client {id_client: 4}), (bibi:Machine {id_machine: 1})
CREATE (erik)-[:HABILITE_SUR {date_formation: date("2026-03-10")}]->(bibi);

MATCH (erik:Client {id_client: 4}), (alpha:Machine {id_machine: 2})
CREATE (erik)-[:HABILITE_SUR {date_formation: date("2026-04-02")}]->(alpha);

MATCH (tom:Client {id_client: 5}), (station:Machine {id_machine: 3})
CREATE (tom)-[:HABILITE_SUR {date_formation: date("2026-02-20")}]->(station);

MATCH (nino:Client {id_client: 6}), (bibi:Machine {id_machine: 1})
CREATE (nino)-[:HABILITE_SUR {date_formation: date("2026-05-15")}]->(bibi);

// --- Relations A_RESERVE : historique de réservation (alimente les recommandations) ---
MATCH (erik:Client {id_client: 4}), (bibi:Machine {id_machine: 1})
CREATE (erik)-[:A_RESERVE {date: date("2026-06-20")}]->(bibi);

MATCH (tom:Client {id_client: 5}), (station:Machine {id_machine: 3})
CREATE (tom)-[:A_RESERVE {date: date("2026-06-23")}]->(station);

MATCH (tom:Client {id_client: 5}), (bibi:Machine {id_machine: 1})
CREATE (tom)-[:A_RESERVE {date: date("2026-05-30")}]->(bibi);

MATCH (nino:Client {id_client: 6}), (bibi:Machine {id_machine: 1})
CREATE (nino)-[:A_RESERVE {date: date("2026-06-22")}]->(bibi);

// --- Relations FREQUENTE : rattache chaque client à ses magasins habituels ---
MATCH (erik:Client {id_client: 4}), (mag1:Magasin {id_magasin: 1})
CREATE (erik)-[:FREQUENTE]->(mag1);

MATCH (tom:Client {id_client: 5}), (mag1:Magasin {id_magasin: 1})
CREATE (tom)-[:FREQUENTE]->(mag1);

MATCH (nino:Client {id_client: 6}), (mag1:Magasin {id_magasin: 1})
CREATE (nino)-[:FREQUENTE]->(mag1);

MATCH (nino:Client {id_client: 6}), (mag2:Magasin {id_magasin: 2})
CREATE (nino)-[:FREQUENTE]->(mag2);

// --- Exemple de requête de recommandation (à garder dans le dossier de conception) ---
// "Les clients qui ont réservé la même machine que moi ont aussi réservé quoi ?"
// MATCH (moi:Client {id_client: 6})-[:A_RESERVE]->(m:Machine)<-[:A_RESERVE]-(autre:Client)-[:A_RESERVE]->(reco:Machine)
// WHERE NOT (moi)-[:A_RESERVE]->(reco)
// RETURN reco.nom, count(*) AS score ORDER BY score DESC;
