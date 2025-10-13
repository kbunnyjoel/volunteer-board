import "./config/loadEnv";
import express from "express";
import cors from "cors";
import { opportunitiesRouter } from "./routes/opportunities";
import { signupsRouter } from "./routes/signups";

const app = express();

const allowedOrigins =
  process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()) ?? [
    "http://localhost:5173"
  ];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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
