-- 03_groupes.sql
-- Gestion des groupes (ex: "Groupe École Ynov") et de leurs associations
-- Exécuté automatiquement au premier démarrage du conteneur MariaDB, après 01_schema.sql et 02_seed.sql

CREATE TABLE IF NOT EXISTS groupes (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    nom  VARCHAR(150) NOT NULL UNIQUE
);

-- association compte <-> groupe (un compte peut appartenir à plusieurs groupes)
CREATE TABLE IF NOT EXISTS user_groupes (
    user_id   INT NOT NULL,
    groupe_id INT NOT NULL,
    PRIMARY KEY (user_id, groupe_id),
    CONSTRAINT fk_ug_user    FOREIGN KEY (user_id)   REFERENCES users(id),
    CONSTRAINT fk_ug_groupe  FOREIGN KEY (groupe_id) REFERENCES groupes(id)
);

-- association groupe <-> magasin (un groupe peut être lié à plusieurs magasins)
CREATE TABLE IF NOT EXISTS groupe_magasins (
    groupe_id  INT NOT NULL,
    magasin_id INT NOT NULL,
    PRIMARY KEY (groupe_id, magasin_id),
    CONSTRAINT fk_gm_groupe  FOREIGN KEY (groupe_id)  REFERENCES groupes(id),
    CONSTRAINT fk_gm_magasin FOREIGN KEY (magasin_id) REFERENCES magasins(id)
);

INSERT INTO groupes (nom) VALUES
('Groupe École Ynov'),
('Groupe Entreprises IB');

-- Tom Martin (5) et Nino Le Bot (6) font partie du groupe École Ynov
INSERT INTO user_groupes (user_id, groupe_id) VALUES
(5, 1),
(6, 1);

-- le groupe École Ynov est lié au magasin FabLab Bordeaux Centre
INSERT INTO groupe_magasins (groupe_id, magasin_id) VALUES
(1, 1);
