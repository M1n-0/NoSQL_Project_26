-- 02_seed.sql
-- Jeu de données de démonstration

-- mot de passe de démo pour tous les comptes seedés : "password123" (haché en bcrypt)
INSERT INTO users (role, email, password_hash, nom, prenom) VALUES
('admin',      'admin@fablab.io',      '$2a$10$JdiyhqwD9Dbj08n3BsTmmOrEtJcZETJkk7nLZh6N38f.dmAnWzXOa',  'Dupuis',  'Sylvie'),
('commercant', 'fablab.bx@fablab.io',  '$2a$10$JdiyhqwD9Dbj08n3BsTmmOrEtJcZETJkk7nLZh6N38f.dmAnWzXOa',   'Garcia',  'Marc'),
('commercant', 'fablab.lh@fablab.io',  '$2a$10$JdiyhqwD9Dbj08n3BsTmmOrEtJcZETJkk7nLZh6N38f.dmAnWzXOa',   'Lefevre', 'Julie'),
('client',     'erik.lebus@mail.io',   '$2a$10$JdiyhqwD9Dbj08n3BsTmmOrEtJcZETJkk7nLZh6N38f.dmAnWzXOa',   'Lebus',   'Erik'),
('client',     'tom.martin@mail.io',   '$2a$10$JdiyhqwD9Dbj08n3BsTmmOrEtJcZETJkk7nLZh6N38f.dmAnWzXOa',   'Martin',  'Tom'),
('client',     'nino@mail.io',         '$2a$10$JdiyhqwD9Dbj08n3BsTmmOrEtJcZETJkk7nLZh6N38f.dmAnWzXOa',   'Le Bot',  'Nino');

INSERT INTO magasins (commercant_id, nom, capacite_max, horaire_ouverture, horaire_fermeture, contact) VALUES
(2, 'FabLab Bordeaux Centre', 12, '09:00:00', '20:00:00', '05 56 00 00 00'),
(3, 'FabLab Le Haillan',       8, '10:00:00', '18:30:00', '05 56 11 11 11');

INSERT INTO machines (magasin_id, nom, fonction, statut, type_reservation) VALUES
(1, 'Imprimante 3D BIBI',        'Impression 3D FDM',     'disponible', 'instantanee'),
(1, 'Decoupeuse laser ALPHA',    'Decoupe laser',         'disponible', 'creneau'),
(1, 'Poste a souder STATION-1',  'Soudure electronique',  'disponible', 'creneau'),
(2, 'Imprimante 3D ECHO',        'Impression 3D resine',  'disponible', 'instantanee'),
(2, 'Fraiseuse CNC DELTA',       'Usinage CNC',           'maintenance','creneau');

INSERT INTO client_magasin (client_id, magasin_id) VALUES
(4, 1), (4, 2), (5, 1), (6, 1), (6, 2);

INSERT INTO reservations (client_id, machine_id, statut, date_debut, date_fin, duree_minutes) VALUES
(4, 1, 'terminee',  '2026-06-20 14:00:00', '2026-06-20 16:30:00', 150),
(5, 3, 'confirmee',  '2026-06-23 09:00:00', '2026-06-23 11:00:00', 120),
(6, 1, 'en_attente', '2026-06-22 18:00:00', NULL, NULL);
