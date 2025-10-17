import { promises as fs } from "fs";
import path from "path";

const BUNDLED_DATA_DIR = path.join(process.cwd(), "..", "..", "data");
const TMP_DATA_DIR = "/tmp/data";

async function ensureTmpDir() {
  try { await fs.mkdir(TMP_DATA_DIR, { recursive: true }); } catch {}
}

async function seedIfMissing(file: string) {
  await ensureTmpDir();
  const tmpFile = path.join(TMP_DATA_DIR, file);
  try {
    await fs.access(tmpFile);
    return tmpFile;
  } catch {
    const bundled = path.join(BUNDLED_DATA_DIR, file);
    const raw = await fs.readFile(bundled, "utf8").catch(() => "[]");
    await fs.writeFile(tmpFile, raw, "utf8");
    return tmpFile;
  }
}

export async function readJson<T = any>(file: string): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    const tmpFile = await seedIfMissing(file);
    const raw = await fs.readFile(tmpFile, "utf8").catch(() => "[]");
    return JSON.parse(raw || "[]");
  }
  
  const raw = await fs.readFile(path.join(BUNDLED_DATA_DIR, file), "utf8").catch(() => "[]");
  return JSON.parse(raw || "[]");
}

export async function writeJson(file: string, data: any) {
  if (process.env.NODE_ENV === "production") {
    const tmpFile = await seedIfMissing(file);
    await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), "utf8");
    return;
  }
  await fs.writeFile(path.join(BUNDLED_DATA_DIR, file), JSON.stringify(data, null, 2), "utf8");
}
