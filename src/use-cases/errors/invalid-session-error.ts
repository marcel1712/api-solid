export class InvalidSessionError extends Error {
  constructor() {
    super("Invalid or expired session.");
  }
}
