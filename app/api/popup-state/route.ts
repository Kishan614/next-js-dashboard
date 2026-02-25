import { NextResponse } from "next/server";
import {
  getPopupState,
  setPopupState,
  getPopupContent,
  setPopupContent,
} from "./store";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function GET() {
  const show = getPopupState();
  const content = getPopupContent();
  return NextResponse.json({ show, content }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.show === "boolean") setPopupState(body.show);
    if (typeof body?.content === "string") setPopupContent(body.content);
    return NextResponse.json(
      { ok: true, show: getPopupState(), content: getPopupContent() },
      { headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Max-Age": "86400",
    },
  });
}
