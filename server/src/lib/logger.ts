type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const LOGFLARE_SOURCE_ID = process.env.LOGFLARE_SOURCE_ID;
const LOGFLARE_API_KEY = process.env.LOGFLARE_API_KEY;
const LOGFLARE_ENDPOINT =
  process.env.LOGFLARE_ENDPOINT?.replace(/\/$/, "") ??
  "https://api.logflare.app/logs";

const configuredLevel = normalizeLevel(process.env.LOG_LEVEL);

function normalizeLevel(level?: string): LogLevel {
  if (!level) return "info";
  const normalized = level.toLowerCase() as LogLevel;
  if (normalized in LOG_LEVELS) {
    return normalized;
  }
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
}

type SerializableError = {
  name: string;
  message: string;
  stack?: string;
};

function serializeError(error: unknown): SerializableError | undefined {
  if (!error || typeof error !== "object") return undefined;
  const err = error as { name?: string; message?: string; stack?: string };
  return {
    name: err.name ?? "Error",
    message: err.message ?? "Unknown error",
    stack: err.stack
  };
}

async function sendToLogflare(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  if (!LOGFLARE_SOURCE_ID || !LOGFLARE_API_KEY) return;

  const payload = {
    source: LOGFLARE_SOURCE_ID,
    log_entry: message,
    metadata: {
      level,
      ...context
    }
  };

  try {
    await fetch(LOGFLARE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": LOGFLARE_API_KEY
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (error) {
    // Last-resort logging: avoid infinite recursion by using console directly.
    console.error("Failed to send log to Logflare", error);
  }
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  if (!shouldLog(level)) return;

  const { error, ...rest } = context ?? {};

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...rest,
    ...(error ? { error: serializeError(error) } : undefined)
  };

  const consoleMethod: LogLevel = level === "debug" ? "info" : level;
  console[consoleMethod](JSON.stringify(payload));

  void sendToLogflare(level, message, {
    ...rest,
    ...(error ? { error: serializeError(error) } : undefined)
  });
}

export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && value in LOG_LEVELS;
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    log("debug", message, context);
  },
  info(message: string, context?: Record<string, unknown>) {
    log("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    log("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>) {
    log("error", message, context);
  }
};

export type { LogLevel };
