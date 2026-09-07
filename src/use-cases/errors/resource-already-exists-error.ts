export class ResourceAlreadyExistsError extends Error {
  constructor(message = "Resource already exists.") {
    super(message);
  }
}
