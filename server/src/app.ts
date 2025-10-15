import "./config/loadEnv";
import express from "express";
import cors from "cors";
import { opportunitiesRouter } from "./routes/opportunities";
import { signupsRouter } from "./routes/signups";
import { isLogLevel, logger, type LogLevel } from "./lib/logger";
import { sentry } from "./lib/sentry";
import { requestLogger } from "./middleware/requestLogger";

const app = express();
app.set("etag", false);

app.use(sentry.requestHandler);

const originPatterns =
  process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()) ?? [
    "http://localhost:5173"
  ];

type OriginRule =
  | { type: "wildcard" }
  | { type: "exact"; value: string }
  | { type: "suffix"; value: string }
  | { type: "protocolSuffix"; protocol: string; suffix: string };

const parsedOriginRules: OriginRule[] = originPatterns
  .filter(Boolean)
  .map((pattern) => {
    const normalizedPattern = pattern.endsWith("/")
      ? pattern.slice(0, -1)
      : pattern;

    if (normalizedPattern === "*") {
      return { type: "wildcard" } as OriginRule;
    }
    const wildcardWithProtocol =
      normalizedPattern.match(/^(https?:\/\/)\*\.(.+)$/i);
    if (wildcardWithProtocol) {
      return {
        type: "protocolSuffix",
        protocol: wildcardWithProtocol[1],
        suffix: `.${wildcardWithProtocol[2]}`
      } as OriginRule;
    }
    if (normalizedPattern.startsWith("*")) {
      return { type: "suffix", value: normalizedPattern.slice(1) } as OriginRule;
    }
    return { type: "exact", value: normalizedPattern } as OriginRule;
  });

logger.info("Configured CORS origins", { origins: originPatterns });

const isOriginAllowed = (origin: string): boolean => {
  const normalizedOrigin = origin.endsWith("/")
    ? origin.slice(0, -1)
    : origin;

  return parsedOriginRules.some((rule) => {
    if (rule.type === "wildcard") return true;
    if (rule.type === "exact") return rule.value === normalizedOrigin;
    if (rule.type === "protocolSuffix") {
      if (!normalizedOrigin.startsWith(rule.protocol)) return false;
      return normalizedOrigin.endsWith(rule.suffix);
    }
    // suffix rule: patterns like *.vercel.app allow any origin ending with .vercel.app
    return normalizedOrigin.endsWith(rule.value);
  });
};


app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      logger.warn("Blocked CORS origin", { origin });
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use(requestLogger);

const logIngestToken = process.env.LOG_INGEST_TOKEN?.trim();

app.post("/api/logs", (req, res) => {
  const token = req.header("x-log-token")?.trim();
  if (logIngestToken && token !== logIngestToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { level, message, context } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing log message" });
  }

  const normalizedLevel =
    typeof level === "string" && isLogLevel(level) ? level : "info";

  const levelToUse = normalizedLevel as LogLevel;

  logger[levelToUse]("Client log", {
    message,
    ...((context && typeof context === "object" && !Array.isArray(context)
      ? context
      : {}) as Record<string, unknown>),
    source: "client"
  });

  return res.status(202).json({ accepted: true });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/signups", signupsRouter);

app.use(sentry.errorHandler);

export { app };
