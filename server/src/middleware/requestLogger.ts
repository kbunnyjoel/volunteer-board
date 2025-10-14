import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();
  const { method, originalUrl } = req;
  const userAgent = req.header("user-agent");

  res.on("finish", () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;

    logger.info("HTTP request completed", {
      method,
      path: originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userAgent,
      requestId: res.getHeader("x-request-id") ?? undefined
    });
  });

  next();
}
