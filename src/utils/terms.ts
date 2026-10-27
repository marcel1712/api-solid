/**
 * Version of the Terms of Use and Privacy Policy currently published on the
 * site (the frontend's `lib/legal.ts` carries the same value). Bump both
 * together whenever the text changes, and every stored acceptance points at
 * the exact text the org agreed to.
 */
export const CURRENT_TERMS_VERSION = "2026-10-27";

/**
 * Versions signup still takes. The API is deployed before the frontend, so
 * for a few minutes the live pages still show — and send — the previous
 * version. Drop the old entry once the new frontend is out.
 */
export const ACCEPTED_TERMS_VERSIONS = [CURRENT_TERMS_VERSION, "2026-10-26"] as const;
