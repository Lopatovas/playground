export class HttpError extends Error {
  public override readonly name = "HttpError";

  public constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFound(message: string): HttpError {
  return new HttpError(404, message);
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}

export function conflict(message: string): HttpError {
  return new HttpError(409, message);
}
