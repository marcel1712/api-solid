export class CnpjNotEligibleError extends Error {
  constructor() {
    super("This CNPJ doesn't belong to a non-profit organization.");
  }
}
