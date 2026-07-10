import { envs } from "./config/plugins/envs.plugin";
import { ServerApp } from "./presentation/server";

// Funcion anonima autoejecutable
(async () => {
  main();
})();

function main() {
  ServerApp.start();
  console.log(envs);
}
