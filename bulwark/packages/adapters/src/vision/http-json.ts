import type { z } from 'zod';
import { ContractViolationError, ServiceError } from '@bulwark/ports';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface HttpJsonClientOptions {
  readonly service: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  /** Total attempts, including the first. */
  readonly maxAttempts: number;
  /** Base delay for the exponential backoff between attempts. */
  readonly retryDelayMs: number;
  readonly fetchImpl?: FetchLike;
  /** Injected so retry backoff is instant in tests without loosening the logic. */
  readonly sleep?: (ms: number) => Promise<void>;
}

/**
 * Small JSON-over-HTTP client for the vision services.
 *
 * It retries only what is safe to retry — connection failures, timeouts and 5xx
 * responses — because a 4xx means the request itself is wrong and repeating it just
 * delays the error. Every response is schema-validated before it reaches the
 * pipeline.
 */
export class HttpJsonClient {
  private readonly options: Required<Omit<HttpJsonClientOptions, 'fetchImpl' | 'sleep'>> & {
    readonly fetchImpl: FetchLike;
    readonly sleep: (ms: number) => Promise<void>;
  };

  constructor(options: HttpJsonClientOptions) {
    if (options.maxAttempts < 1) {
      throw new RangeError('HttpJsonClient requires maxAttempts >= 1');
    }
    this.options = {
      service: options.service,
      baseUrl: options.baseUrl.replace(/\/+$/, ''),
      timeoutMs: options.timeoutMs,
      maxAttempts: options.maxAttempts,
      retryDelayMs: options.retryDelayMs,
      fetchImpl: options.fetchImpl ?? ((input, init) => fetch(input, init)),
      sleep: options.sleep ?? defaultSleep,
    };
  }

  get baseUrl(): string {
    return this.options.baseUrl;
  }

  async postJson<TSchema extends z.ZodTypeAny>(
    path: string,
    body: unknown,
    schema: TSchema,
  ): Promise<z.infer<TSchema>> {
    return this.request('POST', path, body, schema);
  }

  async getJson<TSchema extends z.ZodTypeAny>(
    path: string,
    schema: TSchema,
  ): Promise<z.infer<TSchema>> {
    return this.request('GET', path, undefined, schema);
  }

  private async request<TSchema extends z.ZodTypeAny>(
    method: 'GET' | 'POST',
    path: string,
    body: unknown,
    schema: TSchema,
  ): Promise<z.infer<TSchema>> {
    const url = `${this.options.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
      try {
        const response = await this.options.fetchImpl(url, {
          method,
          signal: controller.signal,
          headers: body === undefined ? undefined : { 'content-type': 'application/json' },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });

        if (!response.ok) {
          const detail = await safeReadText(response);
          const error = new ServiceError(
            this.options.service,
            `${method} ${path} responded ${response.status}`,
            { status: response.status, attempt, detail: truncate(detail) },
          );
          if (response.status >= 500 && attempt < this.options.maxAttempts) {
            lastError = error;
            await this.options.sleep(this.backoffFor(attempt));
            continue;
          }
          throw error;
        }

        const payload: unknown = await response.json();
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          throw new ContractViolationError(
            this.options.service,
            `${method} ${path} returned a payload that does not match the expected contract`,
            { issues: parsed.error.issues.map(describeIssue) },
          );
        }
        return parsed.data as z.infer<TSchema>;
      } catch (error) {
        if (error instanceof ContractViolationError) throw error;
        if (error instanceof ServiceError && !isRetryable(error)) throw error;

        lastError = error;
        if (attempt >= this.options.maxAttempts) break;
        await this.options.sleep(this.backoffFor(attempt));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new ServiceError(
      this.options.service,
      `${method} ${path} failed after ${this.options.maxAttempts} attempt(s)`,
      { url },
      { cause: lastError },
    );
  }

  private backoffFor(attempt: number): number {
    return this.options.retryDelayMs * 2 ** (attempt - 1);
  }
}

function isRetryable(error: ServiceError): boolean {
  const status = error.context['status'];
  return typeof status === 'number' ? status >= 500 : true;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function describeIssue(issue: z.ZodIssue): string {
  const path = issue.path.length === 0 ? '<root>' : issue.path.join('.');
  return `${path}: ${issue.message}`;
}

function truncate(value: string, maxLength = 300): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
