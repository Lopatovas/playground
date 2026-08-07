import { compareStrings } from '../numeric.js';

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Serializes a value with object keys in a fixed order.
 *
 * Reports are diffed and hashed between runs, so two runs that measured the same
 * thing must produce identical bytes even if the objects were assembled in a
 * different key order.
 */
export function canonicalize(value: unknown): JsonValue {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(canonicalize);

  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value;
    case 'number': {
      if (!Number.isFinite(value)) {
        throw new TypeError(`Cannot serialize non-finite number ${value} into a Bulwark report`);
      }
      return value === 0 ? 0 : value;
    }
    case 'undefined':
      throw new TypeError('Cannot canonicalize undefined; omit the property instead');
    case 'object': {
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([a], [b]) => compareStrings(a, b));
      const result: { [key: string]: JsonValue } = {};
      for (const [key, entryValue] of entries) {
        result[key] = canonicalize(entryValue);
      }
      return result;
    }
    default:
      throw new TypeError(`Cannot canonicalize value of type ${typeof value}`);
  }
}

export function canonicalStringify(value: unknown, indent = 2): string {
  return `${JSON.stringify(canonicalize(value), null, indent)}\n`;
}
