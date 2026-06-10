import fs from "node:fs";
import path from "node:path";
import { trackDir } from "./paths.js";
import { loadStageContent } from "./stage-loader.js";
import { trackManifestSchema, type TrackManifest } from "./schemas.js";

export function loadTrackManifest(trackId: string): TrackManifest | null {
  const manifestPath = path.join(trackDir(trackId), "track.json");
  if (!fs.existsSync(manifestPath)) return null;

  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as unknown;
  const parsed = trackManifestSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid track.json for ${trackId}: ${parsed.error.message}`,
    );
  }

  if (parsed.data.id !== trackId) {
    throw new Error(
      `track.json id "${parsed.data.id}" does not match folder "${trackId}"`,
    );
  }

  return parsed.data;
}

export function listTrackStageRefs(trackId: string) {
  const track = loadTrackManifest(trackId);
  if (!track) return [];

  return [...track.stages].sort((a, b) => a.order - b.order);
}

export function getStageContentForTrack(trackId: string, slug: string) {
  return loadStageContent(trackId, slug);
}
