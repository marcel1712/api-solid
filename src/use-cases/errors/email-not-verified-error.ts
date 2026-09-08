export class EmailNotVerifiedError extends Error {
  constructor() {
    super("Please verify your email before logging in.");
  }
}
