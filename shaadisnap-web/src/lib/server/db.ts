import path from "path";
import fsSync from "fs";

export interface SqliteStatement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface SqliteDb {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

// Load Node built-in node:sqlite with TypeScript compatibility for @types/node v20
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.resolve(process.cwd(), "data");
try {
  if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // Read-only filesystem in serverless environments
}

const DB_PATH = path.join(DATA_DIR, "shaadisnap.db");

// Singleton SQLite Database Instance
let dbInstance: SqliteDb | null = null;

export function getDatabase(): SqliteDb {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance!.exec("PRAGMA journal_mode = WAL;");
    dbInstance!.exec("PRAGMA foreign_keys = ON;");
    initSchema(dbInstance!);
  }
  return dbInstance!;
}

function initSchema(db: SqliteDb) {
  db.exec(`
    -- 1. Users & RBAC
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'EVENT_ADMIN' CHECK (role IN ('SUPER_ADMIN', 'EVENT_ADMIN', 'PHOTOGRAPHER', 'GUEST')),
      avatar_url TEXT,
      reset_token TEXT,
      reset_expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 2. Organizations
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      plan TEXT DEFAULT 'ENTERPRISE',
      storage_limit_bytes INTEGER DEFAULT 107374182400, -- 100 GB default
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 3. Organization Members
    CREATE TABLE IF NOT EXISTS organization_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'EVENT_ADMIN',
      created_at INTEGER NOT NULL,
      UNIQUE(organization_id, user_id)
    );

    -- 4. Wedding Events (Multi-Tenant isolation by event_id)
    CREATE TABLE IF NOT EXISTS wedding_events (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      bride_name TEXT NOT NULL,
      groom_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      location TEXT NOT NULL,
      cover_image TEXT,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
      organizer_id TEXT NOT NULL,
      storage_allocated_bytes INTEGER DEFAULT 53687091200, -- 50 GB
      access_code_hash TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 5. Ceremonies
    CREATE TABLE IF NOT EXISTS ceremonies (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      date TEXT,
      description TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(event_id, slug)
    );

    -- 6. Albums
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      ceremony_id TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      cover_photo_id TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(event_id, slug)
    );

    -- 7. Photos
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      ceremony_id TEXT,
      ceremony_name TEXT DEFAULT 'All',
      album_id TEXT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      faces_count INTEGER DEFAULT 0,
      approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending', 'rejected')),
      uploader_type TEXT DEFAULT 'admin' CHECK (uploader_type IN ('admin', 'photographer', 'guest')),
      uploader_id TEXT,
      drive_file_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_photos_event_hash ON photos(event_id, file_hash);
    CREATE INDEX IF NOT EXISTS idx_photos_event_status ON photos(event_id, approval_status);

    -- 8. Photo Faces
    CREATE TABLE IF NOT EXISTS photo_faces (
      id TEXT PRIMARY KEY,
      photo_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      face_id TEXT NOT NULL,
      bbox_json TEXT,
      confidence REAL DEFAULT 0.95,
      sharpness REAL DEFAULT 100.0,
      usable INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_photo_faces_event ON photo_faces(event_id);

    -- 9. Photo Processing Jobs
    CREATE TABLE IF NOT EXISTS photo_processing_jobs (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      photo_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UPLOADING', 'IMPORTING', 'PROCESSING', 'COMPLETED', 'FAILED')),
      progress INTEGER DEFAULT 0,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 10. Guest Passes (Passwordless Access)
    CREATE TABLE IF NOT EXISTS guest_passes (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      token_hash TEXT UNIQUE NOT NULL,
      permissions_json TEXT,
      expires_at INTEGER NOT NULL,
      is_revoked INTEGER DEFAULT 0,
      uses_count INTEGER DEFAULT 0,
      last_used_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_guest_passes_token ON guest_passes(token_hash);

    -- 11. Face Search Sessions (Audit & Retention)
    CREATE TABLE IF NOT EXISTS face_search_sessions (
      id TEXT PRIMARY KEY,
      guest_pass_id TEXT,
      event_id TEXT NOT NULL,
      matches_count INTEGER DEFAULT 0,
      highest_similarity REAL,
      latency_ms INTEGER,
      status TEXT NOT NULL,
      engine TEXT NOT NULL,
      ip_address TEXT,
      created_at INTEGER NOT NULL
    );

    -- 12. Guest Uploads (Guest Candid Moderation Queue)
    CREATE TABLE IF NOT EXISTS guest_uploads (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      guest_pass_id TEXT,
      photo_id TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      moderation_status TEXT DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED')),
      moderated_by TEXT,
      moderated_at INTEGER,
      created_at INTEGER NOT NULL
    );

    -- 13. RSVP Responses
    CREATE TABLE IF NOT EXISTS rsvp_responses (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      attendance_status TEXT NOT NULL CHECK (attendance_status IN ('ATTENDING', 'NOT_ATTENDING', 'TENTATIVE')),
      attendee_count INTEGER DEFAULT 1,
      dietary_preferences TEXT,
      message TEXT,
      created_at INTEGER NOT NULL
    );

    -- 14. Google Drive Connections
    CREATE TABLE IF NOT EXISTS google_drive_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      organization_id TEXT,
      email TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at INTEGER,
      scopes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 15. Storage Usage
    CREATE TABLE IF NOT EXISTS storage_usage (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      total_bytes INTEGER DEFAULT 0,
      photo_count INTEGER DEFAULT 0,
      thumbnail_bytes INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    -- 16. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  // Seed default admin user and default wedding event if database is newly initialized
  seedInitialData(db);
}

function seedInitialData(db: SqliteDb) {
  const userCheck = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCheck.count === 0) {
    const now = Date.now();
    
    // Seed Super Admin: admin@shaadisnap.ai / Admin@ShaadiSnap2026!
    // Stored as scrypt hash with salt for production-grade cryptography
    // We import hashPassword from authService or store precomputed hash
    const adminId = "usr_super_admin_001";
    // Scrypt format: salt:hash
    const defaultSalt = "a1b2c3d4e5f67890a1b2c3d4e5f67890";
    const defaultHash = "6c8e3125e839e55bca7e8e583cbb16df24eefb7e41bdf0eb3e1176b5d9147d34d3d2db7d11ce31ebbcbb1c586111be1484931a02796dc6778f69ef2db44d34bf";
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminId,
      "admin@shaadisnap.ai",
      `${defaultSalt}:${defaultHash}`,
      "Kabir Marwaha (Super Admin)",
      "SUPER_ADMIN",
      now,
      now
    );

    // Seed default wedding event: marwaha-gulati-2026
    const eventId = "marwaha-gulati-2026";
    db.prepare(`
      INSERT INTO wedding_events (
        id, slug, title, bride_name, groom_name, event_date, venue, location,
        cover_image, description, status, organizer_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      "marwaha-gulati-2026",
      "Marwaha & Gulati Wedding Celebration",
      "Dr. Simran Gulati",
      "Kabir Marwaha",
      "November 12-13, 2026",
      "Deventure Shimla Hills Resort",
      "Solan, Himachal Pradesh",
      "/hero-couple.jpg",
      "Celebration of eternal vows amidst the pines of Shimla Hills.",
      "active",
      adminId,
      now,
      now
    );

    // Seed default ceremonies
    const defaultCeremonies = [
      { name: "Mehendi", slug: "mehendi", date: "2026-11-12 11:00" },
      { name: "Haldi", slug: "haldi", date: "2026-11-12 15:00" },
      { name: "Engagement", slug: "engagement", date: "2026-11-12 18:00" },
      { name: "Sangeet", slug: "sangeet", date: "2026-11-12 20:00" },
      { name: "Baraat", slug: "baraat", date: "2026-11-13 10:00" },
      { name: "Phere", slug: "phere", date: "2026-11-13 12:30" },
      { name: "Reception", slug: "reception", date: "2026-11-13 19:30" },
    ];

    for (const c of defaultCeremonies) {
      db.prepare(`
        INSERT INTO ceremonies (id, event_id, name, slug, date, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `cer_${c.slug}`,
        eventId,
        c.name,
        c.slug,
        c.date,
        `${c.name} Ceremony`,
        now
      );

      // Create default album for each ceremony
      db.prepare(`
        INSERT INTO albums (id, event_id, ceremony_id, name, slug, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `alb_${c.slug}`,
        eventId,
        `cer_${c.slug}`,
        `${c.name} Album`,
        c.slug,
        `Photographs from ${c.name}`,
        now
      );
    }

    // Seed default authentic couple portrait photo
    db.prepare(`
      INSERT INTO photos (
        id, event_id, ceremony_id, ceremony_name, album_id, filename, original_name,
        url, thumbnail_url, file_hash, size_bytes, mime_type, faces_count, approval_status,
        uploader_type, uploader_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "hero_couple_photo",
      eventId,
      "cer_reception",
      "Reception",
      "alb_reception",
      "hero-couple.jpg",
      "hero-couple.jpg",
      "/hero-couple.jpg",
      "/hero-couple.jpg",
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      1048576,
      "image/jpeg",
      2,
      "approved",
      "admin",
      adminId,
      now
    );

    // Seed initial storage usage
    db.prepare(`
      INSERT INTO storage_usage (id, event_id, total_bytes, photo_count, thumbnail_bytes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `storage_${eventId}`,
      eventId,
      1048576,
      1,
      262144,
      now
    );
  }
}
