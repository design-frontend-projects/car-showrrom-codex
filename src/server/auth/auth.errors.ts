export class AuthHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(code);
  }
}

export function isAuthHttpError(error: unknown): error is AuthHttpError {
  return error instanceof AuthHttpError;
}
