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

export async function GET() {
  const show = await getPopupState();
  const content = await getPopupContent();
  return NextResponse.json({ show, content }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.show === "boolean") await setPopupState(body.show);
    if (typeof body?.content === "string") await setPopupContent(body.content);
    const show = await getPopupState();
    const content = await getPopupContent();
    return NextResponse.json(
      { ok: true, show, content },
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
