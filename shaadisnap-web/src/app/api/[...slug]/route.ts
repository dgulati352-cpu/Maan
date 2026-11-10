import { NextRequest, NextResponse } from "next/server";

// Import all API handlers
import * as adminAlbums from "@/lib/server/apiHandlers/admin_albums";
import * as adminEvents from "@/lib/server/apiHandlers/admin_events";
import * as adminGuestPasses from "@/lib/server/apiHandlers/admin_guest_passes";
import * as adminModeration from "@/lib/server/apiHandlers/admin_moderation";
import * as adminPhotoJobs from "@/lib/server/apiHandlers/admin_photo_jobs";
import * as adminPhotoJobsRetry from "@/lib/server/apiHandlers/admin_photo_jobs_retry";
import * as adminPhotos from "@/lib/server/apiHandlers/admin_photos";
import * as adminPhotosAnalytics from "@/lib/server/apiHandlers/admin_photos_analytics";
import * as adminPhotosDuplicateCheck from "@/lib/server/apiHandlers/admin_photos_duplicate_check";
import * as adminRsvp from "@/lib/server/apiHandlers/admin_rsvp";

import * as authGoogle from "@/lib/server/apiHandlers/auth_google";
import * as authLogin from "@/lib/server/apiHandlers/auth_login";
import * as authLogout from "@/lib/server/apiHandlers/auth_logout";
import * as authMe from "@/lib/server/apiHandlers/auth_me";

import * as faceSearch from "@/lib/server/apiHandlers/face_search";
import * as galleryPhotos from "@/lib/server/apiHandlers/gallery_photos";

import * as driveAlbums from "@/lib/server/apiHandlers/google_drive_albums";
import * as driveImport from "@/lib/server/apiHandlers/google_drive_import";
import * as drivePhotos from "@/lib/server/apiHandlers/google_drive_photos";
import * as drivePickerConfig from "@/lib/server/apiHandlers/google_drive_picker_config";
import * as drivePickerImport from "@/lib/server/apiHandlers/google_drive_picker_import";

import * as guestFaceSearch from "@/lib/server/apiHandlers/guest_face_search";
import * as guestUploads from "@/lib/server/apiHandlers/guest_uploads";
import * as guestVerifyPass from "@/lib/server/apiHandlers/guest_verify_pass";

import * as imageProxy from "@/lib/server/apiHandlers/image_proxy";
import * as rsvp from "@/lib/server/apiHandlers/rsvp";
import * as uploadPhoto from "@/lib/server/apiHandlers/upload_photo";

export const dynamic = "force-dynamic";

type HandlerModule = {
  GET?: (req: NextRequest) => Promise<NextResponse | Response> | NextResponse | Response;
  POST?: (req: NextRequest) => Promise<NextResponse | Response> | NextResponse | Response;
  PUT?: (req: NextRequest) => Promise<NextResponse | Response> | NextResponse | Response;
  DELETE?: (req: NextRequest) => Promise<NextResponse | Response> | NextResponse | Response;
};

const routeTable: Record<string, HandlerModule> = {
  "admin/albums": adminAlbums,
  "admin/events": adminEvents,
  "admin/guest-passes": adminGuestPasses,
  "admin/moderation": adminModeration,
  "admin/photo-jobs": adminPhotoJobs,
  "admin/photo-jobs/retry": adminPhotoJobsRetry,
  "admin/photos": adminPhotos,
  "admin/photos/analytics": adminPhotosAnalytics,
  "admin/photos/duplicate-check": adminPhotosDuplicateCheck,
  "admin/rsvp": adminRsvp,

  "auth/google": authGoogle,
  "auth/login": authLogin,
  "auth/logout": authLogout,
  "auth/me": authMe,

  "face-search": faceSearch,
  "gallery/photos": galleryPhotos,

  "google-drive/albums": driveAlbums,
  "google-drive/import": driveImport,
  "google-drive/photos": drivePhotos,
  "google-drive/picker-config": drivePickerConfig,
  "google-drive/picker-import": drivePickerImport,

  "guest/face-search": guestFaceSearch,
  "guest/uploads": guestUploads,
  "guest/verify-pass": guestVerifyPass,

  "image-proxy": imageProxy,
  "rsvp": rsvp,
  "upload-photo": uploadPhoto,
};

async function dispatch(req: NextRequest, method: "GET" | "POST" | "PUT" | "DELETE", params: { slug?: string[] }) {
  const path = (params.slug || []).join("/");
  const handlerMod = routeTable[path];

  if (!handlerMod) {
    return NextResponse.json({ error: `API route not found: /api/${path}` }, { status: 404 });
  }

  const handler = handlerMod[method];
  if (!handler) {
    return NextResponse.json({ error: `Method ${method} not allowed on /api/${path}` }, { status: 405 });
  }

  return handler(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const p = await params;
  return dispatch(req, "GET", p);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const p = await params;
  return dispatch(req, "POST", p);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const p = await params;
  return dispatch(req, "PUT", p);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const p = await params;
  return dispatch(req, "DELETE", p);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    },
  });
}

