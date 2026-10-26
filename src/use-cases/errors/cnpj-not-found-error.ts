export class CnpjNotFoundError extends Error {
  constructor() {
    super("This CNPJ was not found at the Receita Federal.");
  }
}
