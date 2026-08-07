import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ContractViolationError, ServiceError } from '@bulwark/ports';
import { HttpJsonClient } from './http-json.js';

const schema = z.object({ ok: z.boolean() });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function client(
  fetchImpl: ReturnType<typeof vi.fn>,
  overrides: Partial<{ maxAttempts: number }> = {},
) {
  return new HttpJsonClient({
    service: 'test-service',
    baseUrl: 'http://vision.local/',
    timeoutMs: 1000,
    maxAttempts: overrides.maxAttempts ?? 3,
    retryDelayMs: 10,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    sleep: () => Promise.resolve(),
  });
}

describe('HttpJsonClient', () => {
  it('posts JSON and returns the validated payload', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const result = await client(fetchImpl).postJson('/v1/detect', { a: 1 }, schema);

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://vision.local/v1/detect');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
  });

  it('normalises trailing slashes and missing leading slashes', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    await client(fetchImpl).getJson('health', schema);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('http://vision.local/health');
  });

  it('retries a 503 and succeeds on a later attempt', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'loading' }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(client(fetchImpl).postJson('/v1/detect', {}, schema)).resolves.toEqual({
      ok: true,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 400, because the request itself is wrong', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: 'bad image' }, 400));

    await expect(client(fetchImpl).postJson('/v1/detect', {}, schema)).rejects.toThrow(
      ServiceError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries a transport failure and gives up with the attempt count', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(client(fetchImpl, { maxAttempts: 2 }).getJson('/health', schema)).rejects.toThrow(
      /failed after 2 attempt/,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('reports a contract violation with the offending field and does not retry', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: 'yes' }));

    const error = await client(fetchImpl)
      .postJson('/v1/detect', {}, schema)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ContractViolationError);
    expect((error as ContractViolationError).context['issues']).toEqual([
      expect.stringContaining('ok:'),
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('includes the response body in the error so a service message survives', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('model not loaded', { status: 400 }));

    const error = await client(fetchImpl)
      .getJson('/health', schema)
      .catch((caught: unknown) => caught);

    expect((error as ServiceError).context['detail']).toBe('model not loaded');
  });

  it('aborts a request that exceeds the timeout', async () => {
    const fetchImpl = vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    const timeoutClient = new HttpJsonClient({
      service: 'test-service',
      baseUrl: 'http://vision.local',
      timeoutMs: 5,
      maxAttempts: 1,
      retryDelayMs: 1,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: () => Promise.resolve(),
    });

    await expect(timeoutClient.getJson('/health', schema)).rejects.toThrow(ServiceError);
  });

  it('rejects a nonsensical attempt count', () => {
    expect(
      () =>
        new HttpJsonClient({
          service: 's',
          baseUrl: 'http://x',
          timeoutMs: 1,
          maxAttempts: 0,
          retryDelayMs: 1,
        }),
    ).toThrow(RangeError);
  });
});
