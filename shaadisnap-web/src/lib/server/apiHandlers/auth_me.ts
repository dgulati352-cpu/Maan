import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/server/authService";

export async function GET(req: NextRequest) {
  // Login removed: Return active authorized organizer session
  return NextResponse.json({
    authenticated: true,
    user: {
      id: "usr_super_admin_001",
      email: "admin@shaadisnap.ai",
      name: "Kabir Marwaha (Organizer)",
      role: "SUPER_ADMIN",
      eventId: "marwaha-gulati-2026",
    },
  });
}

