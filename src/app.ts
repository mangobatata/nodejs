import { envs } from "./config/plugins/envs.plugin";
import { MongoDatabase } from "./data/mongo";

import { ServerApp } from "./presentation/server";

// Funcion anonima autoejecutable
(async () => {
  main();
})();

async function main() {
  await MongoDatabase.connect({
    mongoUrl: envs.MONGO_URL,
    dbName: envs.MONGO_DB_NAME,
  });

 

  await ServerApp.start();
  // console.log(envs);
  // console.log(newLog);
}
