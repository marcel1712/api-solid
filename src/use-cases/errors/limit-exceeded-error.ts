export class LimitExceededError extends Error {
  constructor(message = "Limit exceeded.") {
    super(message);
  }
}
