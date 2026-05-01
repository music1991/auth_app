import { createAvatar, type Style } from "@dicebear/core";
import { avataaars, bottts, pixelArt } from "@dicebear/collection";

type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AvatarType = "avataaars" | "pixel-art" | "bottts";

// Each collection has unique option types that are not mutually assignable.
const COLLECTIONS: Record<AvatarType, Style<object>> = {
  avataaars: avataaars as Style<object>,
  "pixel-art": pixelArt as Style<object>,
  bottts: bottts as Style<object>,
};

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop | null
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!pixelCrop) {
      reject(new Error("No crop area provided"));
      return;
    }

    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

        if (dataUrl.length < 1000) {
          reject(new Error("Cropped image is empty"));
          return;
        }

        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => reject(new Error("Failed to load image for cropping"));
  });
}

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
