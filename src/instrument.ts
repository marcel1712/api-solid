import * as Sentry from "@sentry/node";
import env from "@/env/env";
import { scrubBreadcrumb, scrubEvent } from "@/lib/monitoring";

// Imported first by server.ts, before Fastify, so Sentry can hook into it.
// Errors only: no tracing, which the free plan doesn't need and which would
// send every request's details along.
Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  // The SDK's defaults collect far more than a bug report needs: request
  // bodies (passwords), local variable values in each stack frame (the same
  // passwords, a moment earlier), database query data, cookies. All of it
  // off; only a few harmless headers stay. `scrubEvent` re-checks anyway.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: { allow: ["user-agent", "content-type", "origin"] },
      response: false,
    },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    queues: false,
    stackFrameVariables: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
  },
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
});
