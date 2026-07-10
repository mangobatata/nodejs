import { CheckService } from "../domain/use-cases/checks/check-service";
import { CronService } from "./cron/cron-service";

export class ServerApp {
  public static start() {
    console.log("Server is starting...");

    CronService.createJob("*/5 * * * * *", () => {
      const url = "https://google.com";
      new CheckService(
        () => console.log(`Checking status of ${url}... is ok`),
        (error) => console.log(error),
      ).execute(url);
    });
  }
}
