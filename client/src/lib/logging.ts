import { buildUrl } from "../api/client";

type ClientLogLevel = "debug" | "info" | "warn" | "error";

const LOG_ENDPOINT = buildUrl("/api/logs");
const LOG_TOKEN = import.meta.env.VITE_LOG_INGEST_TOKEN as
  | string
  | undefined;

function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

async function sendLog(
  level: ClientLogLevel,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(LOG_TOKEN ? { "x-log-token": LOG_TOKEN } : {})
      },
      body: JSON.stringify({
        level,
        message,
        context: {
          ...context,
          url: window.location.href,
          userAgent: window.navigator.userAgent
        }
      }),
      keepalive: true
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("Failed to send log entry", error);
    }
  }
}

export const logClientEvent = {
  info(message: string, context?: Record<string, unknown>) {
    void sendLog("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    void sendLog("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>) {
    void sendLog("error", message, context);
  }
};

function extractErrorDetails(error: unknown): Record<string, unknown> {
  if (!error) return {};

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (isPlainObject(error)) {
    return error;
  }

  return { message: String(error) };
}

function handleErrorEvent(event: ErrorEvent) {
  const details = extractErrorDetails(event.error ?? event.message);
  logClientEvent.error("Unhandled browser error", {
    ...details,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    source: "window.error"
  });
}

function handlePromiseRejection(event: PromiseRejectionEvent) {
  const details = extractErrorDetails(event.reason);
  logClientEvent.error("Unhandled promise rejection", {
    ...details,
    source: "window.unhandledrejection"
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("error", handleErrorEvent);
  window.addEventListener("unhandledrejection", handlePromiseRejection);
}
