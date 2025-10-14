import { app } from "./app";
import { logger } from "./lib/logger";

const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, () => {
  logger.info("Volunteer Board API listening", {
    port: PORT,
    url: `http://localhost:${PORT}`
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", {
    error:
      reason instanceof Error
        ? reason
        : new Error(typeof reason === "string" ? reason : "Unknown rejection")
  });
});
