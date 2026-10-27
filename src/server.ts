import app from "@/app";
import env from "@/env/env";
import { makePurgeExpiredAuthRecordsUseCase } from "@/use-cases/factories/make-purge-expired-auth-records-use-case";

const PURGE_INTERVAL_MS = 6 * 60 * 60 * 1000;

// In-process instead of a cron service: there's one instance, and the uptime
// monitor that pings it keeps it from sleeping, so a timer is enough. A missed
// run only means rows wait a few more hours.
async function purgeExpiredAuthRecords() {
  try {
    const removed = await makePurgeExpiredAuthRecordsUseCase().execute();
    app.log.info({ removed }, "Purged expired auth records");
  } catch (error) {
    app.log.error(error, "Failed to purge expired auth records");
  }
}

async function start() {
  try {
    await app
      .listen({ port: env.PORT, host: "0.0.0.0" });
    console.log("HTTP Server Running");

    void purgeExpiredAuthRecords();
    setInterval(purgeExpiredAuthRecords, PURGE_INTERVAL_MS).unref();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
