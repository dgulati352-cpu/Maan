import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/server/authService";

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("shaadisnap_session")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false, error: "Session expired or invalid" }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      eventId: session.eventId,
    },
  });
}

