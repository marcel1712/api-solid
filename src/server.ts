import app from "@/app";
import env from "@/env/env";

async function start() {
  try {
    await app
      .listen({ port: env.PORT, host: "0.0.0.0" });
    console.log("HTTP Server Running");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
