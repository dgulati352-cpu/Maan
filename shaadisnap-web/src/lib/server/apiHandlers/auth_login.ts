import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/server/authService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const result = await authenticateUser(email, password, clientIp);

    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error || "Authentication failed." }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    });

    // Set secure HTTP-only cookie for session persistence
    response.cookies.set({
      name: "shaadisnap_session",
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600, // 7 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal login error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

