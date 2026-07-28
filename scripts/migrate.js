const mongoose = require("mongoose");

const LOCAL_URI = "mongodb://127.0.0.1:27017/exptrack";
const ATLAS_URI = "mongodb+srv://swapnilmkab_db_user:zqSJIzpviMBYKov6@cluster0.rsnwqcy.mongodb.net/exptrack?retryWrites=true&w=majority";

async function migrate() {
  console.log("Connecting to Local MongoDB...");
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("Connected to Local DB.");

  console.log("Connecting to Atlas MongoDB...");
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log("Connected to Atlas DB.");

  const collections = ["users", "accounts", "transactions", "subscriptions", "budgets"];

  for (const collName of collections) {
    console.log(`\nMigrating collection '${collName}'...`);
    const localColl = localConn.collection(collName);
    const atlasColl = atlasConn.collection(collName);

    const docs = await localColl.find({}).toArray();
    console.log(`Found ${docs.length} documents in local '${collName}'.`);

    if (docs.length > 0) {
      await atlasColl.deleteMany({});
      await atlasColl.insertMany(docs);
      console.log(`Successfully migrated ${docs.length} documents to Atlas '${collName}'.`);
    } else {
      console.log(`No documents to migrate for '${collName}'.`);
    }
  }

  await localConn.close();
  await atlasConn.close();
  console.log("\nMigration completed successfully!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
