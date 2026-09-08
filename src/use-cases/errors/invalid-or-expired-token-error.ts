export class InvalidOrExpiredTokenError extends Error {
  constructor() {
    super("Invalid or expired token.");
  }
}
