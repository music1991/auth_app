import { createAvatar } from "@dicebear/core";
import { avataaars, bottts, pixelArt } from "@dicebear/collection";

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, content] = dataUrl.split(",");
  const isBase64 = /;base64$/.test(meta);
  const mime = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
  const raw = isBase64 ? atob(content) : decodeURIComponent(content);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function generateDiceBearAvatar(type: string, seed?: string) {
  const options = { seed: seed || Math.random().toString(36).substring(2), size: 256 };
  const collections: any = { "avataaars": avataaars, "pixel-art": pixelArt, "bottts": bottts };
  return createAvatar(collections[type] || avataaars, options).toDataUri();
}
