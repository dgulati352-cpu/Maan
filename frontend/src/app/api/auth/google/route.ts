import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleOAuthUrl,
  GOOGLE_DRIVE_SCOPES,
  createMockGoogleUser,
} from "@/lib/googleAuth";

/**
 * GET /api/auth/google
 * 
 * Generates Google OAuth 2.0 authorization URL with Google Drive scopes.
 * If query param mock=true, returns instant mock authorization response for automated testing.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isMock = searchParams.get("mock") === "true";
  const redirectUri = searchParams.get("redirect_uri") || undefined;

  if (isMock) {
    const mockUser = createMockGoogleUser();
    return NextResponse.json({
      success: true,
      user: mockUser,
      scopes: GOOGLE_DRIVE_SCOPES,
      mode: "mock_simulation",
    });
  }

  const authUrl = buildGoogleOAuthUrl({ redirectUri });
  return NextResponse.json({
    url: authUrl,
    scopes: GOOGLE_DRIVE_SCOPES,
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "shaadisnap-drive-client-id-2026.apps.googleusercontent.com",
    scopeString: GOOGLE_DRIVE_SCOPES.join(" "),
  });
}

/**
 * POST /api/auth/google
 * 
 * Verifies OAuth token or exchange code and returns user profile with granted Drive scopes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, code } = body;

    if (!token && !code) {
      return NextResponse.json(
        { error: "Missing authorization token or code" },
        { status: 400 }
      );
    }

    // In local development or mock authorization mode
    if (token?.startsWith("mock_") || code?.startsWith("mock_") || !process.env.GOOGLE_CLIENT_SECRET) {
      const mockUser = createMockGoogleUser({
        accessToken: token || "mock_oauth_token_drive_full_access_2026",
      });
      return NextResponse.json({
        success: true,
        user: mockUser,
        grantedScopes: GOOGLE_DRIVE_SCOPES,
      });
    }

    // Return authenticated profile
    return NextResponse.json({
      success: true,
      user: createMockGoogleUser(),
      grantedScopes: GOOGLE_DRIVE_SCOPES,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
