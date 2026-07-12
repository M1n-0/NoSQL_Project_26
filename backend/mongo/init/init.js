// init.js — exécuté automatiquement au premier démarrage du conteneur mongo

db = db.getSiblingDB('fablab');

db.createCollection('machines_details');
db.createCollection('magasins_details');

// --- Fiches machines : structure très variable selon le type ---
// L'id_machine fait le lien logique avec la table SQL "machines" (pas de FK physique entre les 2 bases)
db.machines_details.insertMany([
  {
    id_machine: 1,
    type: "imprimante_3d",
    nom: "Imprimante 3D BIBI",
    specs: {
      technologie: "FDM",
      volume_impression_mm: { x: 220, y: 220, z: 250 },
      materiaux_compatibles: ["PLA", "PETG", "ABS"],
      diametre_buse_mm: 0.4,
      resolution_couche_mm: 0.1
    },
    photos: ["bibi_1.jpg", "bibi_2.jpg"],
    notice_pdf: "notices/imprimante_bibi.pdf"
  },
  {
    id_machine: 2,
    type: "decoupeuse_laser",
    nom: "Decoupeuse laser ALPHA",
    specs: {
      puissance_watts: 40,
      surface_travail_mm: { x: 400, y: 600 },
      materiaux_compatibles: ["bois", "acrylique", "carton"],
      epaisseur_max_mm: 10,
      type_laser: "CO2"
    },
    photos: ["alpha_1.jpg"],
    consignes_securite: "Port de lunettes obligatoire, extraction des fumées active requise"
  },
  {
    id_machine: 3,
    type: "poste_soudure",
    nom: "Poste a souder STATION-1",
    specs: {
      plage_temperature_celsius: { min: 150, max: 480 },
      type_panne: ["fine", "biseau"],
      station_dessoudage: true
    },
    photos: ["station1_1.jpg"]
  },
  {
    id_machine: 4,
    type: "imprimante_3d",
    nom: "Imprimante 3D ECHO",
    specs: {
      technologie: "resine_SLA",
      volume_impression_mm: { x: 145, y: 145, z: 175 },
      materiaux_compatibles: ["resine standard", "resine flexible"],
      resolution_xy_microns: 35
    },
    photos: ["echo_1.jpg"]
  },
  {
    id_machine: 5,
    type: "fraiseuse_cnc",
    nom: "Fraiseuse CNC DELTA",
    specs: {
      surface_travail_mm: { x: 300, y: 300, z: 100 },
      materiaux_compatibles: ["bois", "aluminium", "plastique dur"],
      nombre_axes: 3
    },
    photos: ["delta_1.jpg"],
    derniere_maintenance: "2026-06-15"
  }
]);

// --- Fiches magasins enrichies ---
db.magasins_details.insertMany([
  {
    id_magasin: 1,
    nom: "FabLab Bordeaux Centre",
    description: "Espace partagé de 200m2 dedie au prototypage rapide, ouvert aux particuliers et entreprises.",
    photos: ["bx_centre_1.jpg", "bx_centre_2.jpg"],
    reglement_interieur: "reglements/bx_centre.pdf",
    equipements_annexes: ["wifi", "salle de reunion", "espace coworking"]
  },
  {
    id_magasin: 2,
    nom: "FabLab Le Haillan",
    description: "Petit fablab de quartier oriente electronique et impression 3D.",
    photos: ["lh_1.jpg"],
    reglement_interieur: "reglements/lh.pdf",
    equipements_annexes: ["wifi"]
  }
]);

print("Seed MongoDB termine : " + db.machines_details.countDocuments() + " machines, " + db.magasins_details.countDocuments() + " magasins.");
