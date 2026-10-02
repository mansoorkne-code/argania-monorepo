export type DomainErrorCode =
  | "INVALID_ORDER_INPUT"
  | "INSUFFICIENT_INVENTORY"
  | "INVALID_ORDER_TRANSITION";

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
