import "./config/loadEnv";
import express from "express";
import cors from "cors";
import { opportunitiesRouter } from "./routes/opportunities";
import { signupsRouter } from "./routes/signups";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/signups", signupsRouter);

export { app };
