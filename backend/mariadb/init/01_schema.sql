-- 01_schema.sql
-- Schéma relationnel FabLab Manager
-- Exécuté automatiquement au premier démarrage du conteneur MariaDB

CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    role          ENUM('admin', 'commercant', 'client') NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nom           VARCHAR(100) NOT NULL,
    prenom        VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS magasins (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    commercant_id   INT NOT NULL,
    nom             VARCHAR(150) NOT NULL,
    capacite_max    INT NOT NULL,
    horaire_ouverture TIME NOT NULL,
    horaire_fermeture TIME NOT NULL,
    contact         VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_magasin_commercant FOREIGN KEY (commercant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS machines (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    magasin_id  INT NOT NULL,
    nom         VARCHAR(150) NOT NULL,
    fonction    VARCHAR(150) NOT NULL,
    statut      ENUM('disponible', 'reserve', 'maintenance') NOT NULL DEFAULT 'disponible',
    type_reservation ENUM('instantanee', 'creneau') NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_machine_magasin FOREIGN KEY (magasin_id) REFERENCES magasins(id)
);

-- association client <-> magasin (un client peut être lié à plusieurs magasins)
CREATE TABLE IF NOT EXISTS client_magasin (
    client_id  INT NOT NULL,
    magasin_id INT NOT NULL,
    PRIMARY KEY (client_id, magasin_id),
    CONSTRAINT fk_cm_client  FOREIGN KEY (client_id)  REFERENCES users(id),
    CONSTRAINT fk_cm_magasin FOREIGN KEY (magasin_id) REFERENCES magasins(id)
);

CREATE TABLE IF NOT EXISTS reservations (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    client_id    INT NOT NULL,
    machine_id   INT NOT NULL,
    statut       ENUM('en_attente', 'confirmee', 'terminee', 'annulee') NOT NULL DEFAULT 'en_attente',
    date_debut   DATETIME NOT NULL,
    date_fin     DATETIME,
    duree_minutes INT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resa_client  FOREIGN KEY (client_id)  REFERENCES users(id),
    CONSTRAINT fk_resa_machine FOREIGN KEY (machine_id) REFERENCES machines(id)
);

CREATE INDEX idx_reservations_machine ON reservations(machine_id);
CREATE INDEX idx_reservations_client  ON reservations(client_id);
