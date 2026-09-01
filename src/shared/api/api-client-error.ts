export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly traceId?: string;
  readonly sessionExpired: boolean;

  constructor({
    status,
    code,
    message,
    details,
    traceId,
    sessionExpired = false,
  }: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
    traceId?: string;
    sessionExpired?: boolean;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.traceId = traceId;
    this.sessionExpired = sessionExpired;
  }
}
