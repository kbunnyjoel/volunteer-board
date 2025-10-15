import * as Sentry from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0");

const sentryEnabled = Boolean(SENTRY_DSN);

if (sentryEnabled) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0
  });
}

const noopRequestHandler: Parameters<typeof Sentry.Handlers.requestHandler>[0] = (_req, _res, next) =>
  next();

const noopErrorHandler: Parameters<typeof Sentry.Handlers.errorHandler>[0] = (err, _req, _res, next) =>
  next(err);

export const sentry = {
  enabled: sentryEnabled,
  requestHandler: sentryEnabled
    ? Sentry.Handlers.requestHandler({ user: false })
    : noopRequestHandler,
  errorHandler: sentryEnabled ? Sentry.Handlers.errorHandler() : noopErrorHandler,
  captureException(error: unknown) {
    if (!sentryEnabled) return;
    Sentry.captureException(error);
  }
};

export { Sentry };
