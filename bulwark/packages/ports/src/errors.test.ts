import { describe, expect, it } from 'vitest';
import {
  BulwarkError,
  ConfigurationError,
  ContractViolationError,
  MissingArtifactError,
  ServiceError,
} from './errors.js';

describe('BulwarkError', () => {
  it('carries structured context alongside the message', () => {
    const error = new BulwarkError('run failed', { runId: 'r1' });
    expect(error.message).toBe('run failed');
    expect(error.context).toEqual({ runId: 'r1' });
    expect(error.name).toBe('BulwarkError');
    expect(error).toBeInstanceOf(Error);
  });

  it('preserves the cause chain', () => {
    const cause = new Error('socket hang up');
    const error = new BulwarkError('detector unreachable', {}, { cause });
    expect(error.cause).toBe(cause);
  });
});

describe('ServiceError', () => {
  it('prefixes the failing service and records it in context', () => {
    const error = new ServiceError('omniparser', 'responded 503', { attempt: 2 });
    expect(error.message).toBe('omniparser: responded 503');
    expect(error.context).toEqual({ attempt: 2, service: 'omniparser' });
    expect(error.service).toBe('omniparser');
  });

  it('keeps subclass names for log filtering', () => {
    expect(new ContractViolationError('paddleocr', 'missing boxes').name).toBe(
      'ContractViolationError',
    );
    expect(new ContractViolationError('paddleocr', 'missing boxes')).toBeInstanceOf(ServiceError);
  });
});

describe('error taxonomy', () => {
  it('separates configuration and missing-input failures from service failures', () => {
    expect(new ConfigurationError('no design image configured')).toBeInstanceOf(BulwarkError);
    expect(new ConfigurationError('x')).not.toBeInstanceOf(ServiceError);
    expect(new MissingArtifactError('design.png not found').name).toBe('MissingArtifactError');
  });
});
