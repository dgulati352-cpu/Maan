import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/google-drive/picker-config
 * 
 * Safely provides client-side credentials for Google Picker API & Google Identity Services (GIS).
 * Never exposes client secrets or service account private keys.
 */
export async function GET() {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    "828535566976-shaadisnap.apps.googleusercontent.com";

  const developerKey =
    process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDvY8S1PmcBl08Dgdn72RjPVRG-YnRJuKM";

  const appId =
    process.env.GOOGLE_APP_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "828535566976";

  const defaultFolderId =
    process.env.GOOGLE_DRIVE_FOLDER_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID ||
    "1G53zacxOMhcxh7EDhnL37oRgN3awVJsy";

  const defaultFolderUrl = `https://drive.google.com/drive/folders/${defaultFolderId}`;

  return NextResponse.json({
    success: true,
    clientId,
    developerKey,
    apiKey: developerKey,
    appId,
    defaultFolderId,
    defaultFolderUrl,
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
}

