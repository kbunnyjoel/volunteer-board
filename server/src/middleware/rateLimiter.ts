import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const maxRequests = Number(process.env.RATE_LIMIT_MAX ?? 60);

export const apiRateLimiter = rateLimit({
  windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
  max: Number.isFinite(maxRequests) && maxRequests > 0 ? maxRequests : 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." }
});
