/**
 * Failures at a boundary, distinguished from programmer errors so the CLI and the
 * API can turn them into an actionable message instead of a stack trace.
 */
export class BulwarkError extends Error {
  constructor(
    message: string,
    readonly context: Readonly<Record<string, unknown>> = {},
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** A dependency outside the process misbehaved: HTTP failure, bad payload, timeout. */
export class ServiceError extends BulwarkError {
  constructor(
    readonly service: string,
    message: string,
    context: Readonly<Record<string, unknown>> = {},
    options?: { cause?: unknown },
  ) {
    super(`${service}: ${message}`, { ...context, service }, options);
  }
}

/** A payload did not match the shape the adapter requires. */
export class ContractViolationError extends ServiceError {}

/** Configuration is missing or internally inconsistent. */
export class ConfigurationError extends BulwarkError {}

/** The run cannot continue because an input is absent. */
export class MissingArtifactError extends BulwarkError {}
