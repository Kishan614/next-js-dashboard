/**
 * Popup state with file persistence so it survives server restarts.
 * In-memory cache is used; state is read from file on first access and
 * written to file on every change. On read-only hosts (e.g. Vercel),
 * writes are no-ops and state resets on restart — use a DB or KV there.
 */
import { readFileSync, writeFile, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const STATE_FILE = join(DATA_DIR, "popup-state.json");

let popupShow = false;
let popupContent = "";
let loaded = false;

function loadFromFile(): void {
  if (loaded) return;
  loaded = true;
  try {
    const raw = readFileSync(STATE_FILE, "utf8");
    const data = JSON.parse(raw);
    if (typeof data.show === "boolean") popupShow = data.show;
    if (typeof data.content === "string") popupContent = data.content;
  } catch {
    // File missing or invalid — keep defaults
  }
}

function persistToFile(): void {
  const payload = JSON.stringify({
    show: popupShow,
    content: popupContent,
    updatedAt: new Date().toISOString(),
  });
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFile(STATE_FILE, payload, "utf8", () => {});
  } catch {
    // Read-only FS (e.g. Vercel) — state will reset on restart
  }
}

export function getPopupState(): boolean {
  loadFromFile();
  return popupShow;
}

export function setPopupState(show: boolean): void {
  loadFromFile();
  popupShow = show;
  persistToFile();
}

export function getPopupContent(): string {
  loadFromFile();
  return popupContent;
}

export function setPopupContent(content: string): void {
  loadFromFile();
  popupContent = typeof content === "string" ? content : "";
  persistToFile();
}
