/* ===========================================================
   Connexion MongoDB
   À COMPLÉTER PAR L'ÉQUIPE BASES DE DONNÉES.

   Usage prévu ailleurs dans le code :
     const { getMongoDb } = require("../config/mongo.config");
     const db = await getMongoDb();
     const machines = await db.collection("machine_sheets").find().toArray();
   =========================================================== */

const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");
let dbInstance = null;

async function getMongoDb() {
  if (!dbInstance) {
    await client.connect();
    dbInstance = client.db(process.env.MONGO_DATABASE || "fablab_manager");
  }
  return dbInstance;
}

module.exports = { getMongoDb };
