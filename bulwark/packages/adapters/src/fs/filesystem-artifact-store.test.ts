import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BulwarkError, MissingArtifactError } from '@bulwark/ports';
import { FilesystemArtifactStore, FilesystemResponseCache } from './filesystem-artifact-store.js';

describe('FilesystemArtifactStore', () => {
  let root: string;
  let store: FilesystemArtifactStore;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'bulwark-store-'));
    store = new FilesystemArtifactStore(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes and reads bytes, creating directories as needed', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const path = await store.write('captures/live.png', bytes);

    expect(path).toBe(join(root, 'captures/live.png'));
    expect(new Uint8Array(await readFile(path))).toEqual(bytes);
    expect(await store.read('captures/live.png')).toEqual(bytes);
  });

  it('writes and reads text', async () => {
    await store.writeText('report.json', '{"a":1}\n');
    expect(await store.readText('report.json')).toBe('{"a":1}\n');
  });

  it('reports existence without throwing', async () => {
    expect(await store.exists('missing.json')).toBe(false);
    await store.writeText('present.json', '{}');
    expect(await store.exists('present.json')).toBe(true);
  });

  it('raises a typed error for a missing artifact', async () => {
    await expect(store.read('missing.png')).rejects.toThrow(MissingArtifactError);
  });

  it('lists files recursively in a stable order', async () => {
    await store.writeText('b.json', '{}');
    await store.writeText('a/second.json', '{}');
    await store.writeText('a/first.json', '{}');

    expect(await store.list()).toEqual(['a/first.json', 'a/second.json', 'b.json']);
    expect(await store.list('a')).toEqual(['a/first.json', 'a/second.json']);
  });

  it('returns an empty listing for a directory that does not exist', async () => {
    expect(await store.list('nope')).toEqual([]);
  });

  it('refuses to escape the run directory', async () => {
    expect(() => store.resolve('../outside.png')).toThrow(BulwarkError);
    expect(() => store.resolve('nested/../../outside.png')).toThrow(/escapes the run directory/);
    await expect(store.read('../outside.png')).rejects.toThrow(/escapes the run directory/);
  });

  it('refuses absolute paths', () => {
    expect(() => store.resolve('/etc/passwd')).toThrow(/must be relative/);
  });

  it('allows a path that merely starts with the root name', () => {
    expect(() => store.resolve('nested/deeper/file.png')).not.toThrow();
  });
});

describe('FilesystemResponseCache', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'bulwark-cache-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('round-trips an entry', async () => {
    const cache = new FilesystemResponseCache(root);
    await cache.set('detect/omniparser/design/abc', new Uint8Array([7, 7]));
    expect(await cache.get('detect/omniparser/design/abc')).toEqual(new Uint8Array([7, 7]));
  });

  it('returns null for a miss rather than throwing', async () => {
    expect(await new FilesystemResponseCache(root).get('nothing/here')).toBeNull();
  });

  it('sanitises keys into safe filenames', async () => {
    const cache = new FilesystemResponseCache(root);
    await cache.set('weird key:with*chars', new Uint8Array([1]));
    expect(await cache.get('weird key:with*chars')).toEqual(new Uint8Array([1]));
  });

  it('survives being reconstructed, so a later process can replay', async () => {
    await new FilesystemResponseCache(root).set('k/1', new Uint8Array([42]));
    expect(await new FilesystemResponseCache(root).get('k/1')).toEqual(new Uint8Array([42]));
  });
});
