export class RegistrationBlockedError extends Error {
  constructor() {
    super("This email or WhatsApp number can't be used to register.");
  }
}
