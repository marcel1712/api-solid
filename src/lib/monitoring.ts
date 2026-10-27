import * as Sentry from "@sentry/node";
import type { Breadcrumb, ErrorEvent } from "@sentry/node";

const stripQuery = (url: string) => url.split("?")[0];

/**
 * Error reports leave for Sentry, so nothing personal or secret goes with
 * them: email links carry their token in the query string, request bodies
 * carry passwords, and cookies and the Authorization header carry sessions.
 * Only what helps find the bug stays — the route, the stack, the message.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
    delete event.request.data;

    if (event.request.headers) {
      const headers = { ...event.request.headers };
      for (const name of Object.keys(headers)) {
        if (["authorization", "cookie"].includes(name.toLowerCase())) {
          delete headers[name];
        }
      }
      event.request.headers = headers;
    }
  }

  delete event.user;

  return event;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const url = breadcrumb.data?.url;
  if (typeof url === "string") {
    breadcrumb.data = { ...breadcrumb.data, url: stripQuery(url) };
  }
  return breadcrumb;
}

/**
 * For failures the request survives — a lost email, a lookup that fell back —
 * which never reach the error handler and would otherwise only be a log line
 * nobody reads. Without SENTRY_DSN (local, tests) this does nothing.
 */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
