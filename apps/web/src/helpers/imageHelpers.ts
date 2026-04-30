import { createAvatar, type Style } from "@dicebear/core";
import { avataaars, bottts, pixelArt } from "@dicebear/collection";

type AvatarType = "avataaars" | "pixel-art" | "bottts";

// Each collection has unique option types that are not mutually assignable.
const COLLECTIONS: Record<AvatarType, Style<object>> = {
  avataaars: avataaars as Style<object>,
  "pixel-art": pixelArt as Style<object>,
  bottts: bottts as Style<object>,
};

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, content] = dataUrl.split(",");
  const isBase64 = /;base64$/.test(meta);
  const mime = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
  const raw = isBase64 ? atob(content) : decodeURIComponent(content);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function generateDiceBearAvatar(type: AvatarType, seed?: string): string {
  const collection = COLLECTIONS[type] ?? (avataaars as Style<object>);
  return createAvatar(collection, {
    seed: seed ?? Math.random().toString(36).substring(2),
    size: 256,
  }).toDataUri();
}
