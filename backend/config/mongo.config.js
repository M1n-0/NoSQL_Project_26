/* ===========================================================
   Connexion MongoDB
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
