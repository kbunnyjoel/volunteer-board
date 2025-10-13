import "./config/loadEnv";
import express from "express";
import cors from "cors";
import { opportunitiesRouter } from "./routes/opportunities";
import { signupsRouter } from "./routes/signups";

const app = express();

const originPatterns =
  process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()) ?? [
    "http://localhost:5173"
  ];

type OriginRule =
  | { type: "wildcard" }
  | { type: "exact"; value: string }
  | { type: "suffix"; value: string };

const parsedOriginRules: OriginRule[] = originPatterns
  .filter(Boolean)
  .map((pattern) => {
    if (pattern === "*") {
      return { type: "wildcard" } as OriginRule;
    }
    if (pattern.startsWith("*")) {
      return { type: "suffix", value: pattern.slice(1) } as OriginRule;
    }
    return { type: "exact", value: pattern } as OriginRule;
  });

const isOriginAllowed = (origin: string): boolean => {
  return parsedOriginRules.some((rule) => {
    if (rule.type === "wildcard") return true;
    if (rule.type === "exact") return rule.value === origin;
    // suffix rule: pattern like *.vercel.app allows any origin ending with .vercel.app
    return origin.endsWith(rule.value);
  });
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/signups", signupsRouter);

export { app };
