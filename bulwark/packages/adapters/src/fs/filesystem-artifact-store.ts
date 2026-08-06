import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { ArtifactStore, ResponseCache } from '@bulwark/ports';
import { BulwarkError, MissingArtifactError } from '@bulwark/ports';

/**
 * Artifacts on local disk, confined to one run directory.
 *
 * Every path is resolved and checked against the root before use. The store is
 * handed paths that come from a report or an HTTP request, so a `..` segment must not
 * be able to read or overwrite anything outside the run.
 */
export class FilesystemArtifactStore implements ArtifactStore {
  readonly rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = resolve(rootPath);
  }

  resolve(relativePath: string): string {
    if (isAbsolute(relativePath)) {
      throw new BulwarkError(`Artifact path must be relative, received "${relativePath}"`);
    }
    const target = resolve(this.rootPath, relativePath);
    const rootWithSep = this.rootPath.endsWith(sep) ? this.rootPath : `${this.rootPath}${sep}`;
    if (target !== this.rootPath && !target.startsWith(rootWithSep)) {
      throw new BulwarkError(`Artifact path "${relativePath}" escapes the run directory`, {
        rootPath: this.rootPath,
      });
    }
    return target;
  }

  async write(relativePath: string, bytes: Uint8Array): Promise<string> {
    const target = this.resolve(relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    return target;
  }

  async writeText(relativePath: string, text: string): Promise<string> {
    return this.write(relativePath, Buffer.from(text, 'utf8'));
  }

  async read(relativePath: string): Promise<Uint8Array> {
    const target = this.resolve(relativePath);
    try {
      return new Uint8Array(await readFile(target));
    } catch (error) {
      throw new MissingArtifactError(`Artifact "${relativePath}" is not present`, {
        path: target,
      }, { cause: error });
    }
  }

  async readText(relativePath: string): Promise<string> {
    return Buffer.from(await this.read(relativePath)).toString('utf8');
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await stat(this.resolve(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  /** Relative paths of every file below `relativeDirectory`, sorted. */
  async list(relativeDirectory = '.'): Promise<readonly string[]> {
    const target = this.resolve(relativeDirectory);
    const found: string[] = [];

    const walk = async (directory: string): Promise<void> => {
      let entries;
      try {
        entries = await readdir(directory, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
        const entryPath = join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(entryPath);
        } else {
          found.push(relative(this.rootPath, entryPath).split(sep).join('/'));
        }
      }
    };

    await walk(target);
    return found.sort();
  }
}

/** Cache entries as files under a directory, keyed by a hashed cache key. */
export class FilesystemResponseCache implements ResponseCache {
  constructor(private readonly directory: string) {}

  async get(key: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await readFile(this.pathFor(key)));
    } catch {
      return null;
    }
  }

  async set(key: string, value: Uint8Array): Promise<void> {
    const target = this.pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, value);
  }

  private pathFor(key: string): string {
    // Keys embed a content hash, so slashes become a shallow directory layout and
    // any other character is escaped to keep the name filesystem-safe.
    const safe = key.replace(/[^a-zA-Z0-9/_-]/g, '_');
    return resolve(this.directory, `${safe}.json`);
  }
}
