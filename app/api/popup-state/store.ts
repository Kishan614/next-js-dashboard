/**
 * Popup state with optional Upstash Redis or file persistence.
 * - If UPSTASH_REDIS_REST_URL is set: use Upstash Redis (persists on Vercel).
 * - Else: use file (data/popup-state.json) for writable hosts, or in-memory.
 */
import { readFileSync, writeFile, mkdirSync } from "fs";
import { join } from "path";

const REDIS_KEY = "popup-state";
const DATA_DIR = join(process.cwd(), "data");
const STATE_FILE = join(DATA_DIR, "popup-state.json");

let popupShow = false;
let popupContent = "";
let fileLoaded = false;

function getRedisUrl(): string | null {
  return (
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    null
  );
}

function getRedisToken(): string | null {
  return (
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    null
  );
}

function useRedis(): boolean {
  const url = getRedisUrl();
  return typeof url === "string" && url.length > 0;
}

async function createRedisClient() {
  const url = getRedisUrl();
  const token = getRedisToken();
  if (!url || !token) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url, token });
}

async function redisGet(): Promise<{ show: boolean; content: string }> {
  if (!useRedis()) return { show: popupShow, content: popupContent };
  try {
    const redis = await createRedisClient();
    if (!redis) return { show: popupShow, content: popupContent };
    const raw = await redis.get<{ show?: unknown; content?: unknown }>(REDIS_KEY);
    if (raw && typeof raw === "object" && "show" in raw) {
      return {
        show: Boolean(raw.show),
        content: typeof raw.content === "string" ? raw.content : "",
      };
    }
  } catch {
    // Fall through to in-memory / file
  }
  return { show: popupShow, content: popupContent };
}

async function redisSet(show: boolean, content: string): Promise<void> {
  if (!useRedis()) return;
  try {
    const redis = await createRedisClient();
    if (!redis) return;
    await redis.set(REDIS_KEY, {
      show,
      content,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}

function loadFromFile(): void {
  if (fileLoaded) return;
  fileLoaded = true;
  try {
    const raw = readFileSync(STATE_FILE, "utf8");
    const data = JSON.parse(raw);
    if (typeof data.show === "boolean") popupShow = data.show;
    if (typeof data.content === "string") popupContent = data.content;
  } catch {
    // File missing or invalid
  }
}

function persistToFile(show: boolean, content: string): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFile(
      STATE_FILE,
      JSON.stringify({ show, content, updatedAt: new Date().toISOString() }),
      "utf8",
      () => {}
    );
  } catch {
    // Read-only FS
  }
}

export async function getPopupState(): Promise<boolean> {
  if (useRedis()) {
    const data = await redisGet();
    popupShow = data.show;
    popupContent = data.content;
    return data.show;
  }
  loadFromFile();
  return popupShow;
}

export async function setPopupState(show: boolean): Promise<void> {
  if (useRedis()) {
    const data = await redisGet();
    popupShow = show;
    popupContent = data.content;
    await redisSet(popupShow, popupContent);
    return;
  }
  loadFromFile();
  popupShow = show;
  persistToFile(popupShow, popupContent);
}

export async function getPopupContent(): Promise<string> {
  if (useRedis()) {
    const data = await redisGet();
    popupShow = data.show;
    popupContent = data.content;
    return data.content;
  }
  loadFromFile();
  return popupContent;
}

export async function setPopupContent(content: string): Promise<void> {
  const safe = typeof content === "string" ? content : "";
  if (useRedis()) {
    const data = await redisGet();
    popupShow = data.show;
    popupContent = safe;
    await redisSet(popupShow, popupContent);
    return;
  }
  loadFromFile();
  popupContent = safe;
  persistToFile(popupShow, popupContent);
}
