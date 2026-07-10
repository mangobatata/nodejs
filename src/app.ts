import { ServerApp } from "./presentation/server";

// Funcion anonima autoejecutable
(async () => {
  main();
})();

function main() {
  ServerApp.start();
}
