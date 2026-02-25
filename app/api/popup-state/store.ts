/**
 * In-memory store for popup state and content. Shared across API route handlers.
 * For production with multiple instances, replace with Redis or a database.
 */
let popupShow = false;
let popupContent = "";

export function getPopupState(): boolean {
  return popupShow;
}

export function setPopupState(show: boolean): void {
  popupShow = show;
}

export function getPopupContent(): string {
  return popupContent;
}

export function setPopupContent(content: string): void {
  popupContent = typeof content === "string" ? content : "";
}
