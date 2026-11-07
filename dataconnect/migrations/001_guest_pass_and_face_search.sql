-- ============================================================================
-- ShaadiSnap AI / Maan AI — Database Migration 001
-- Login-Free Guest Pass, Biometric Face Search Sessions, Audit Logs & Processing Queue
-- Compatible with PostgreSQL 14+ / Google Cloud SQL / Firebase Data Connect
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Guest Passes (High-entropy tokens stored as SHA-256 hashes)
CREATE TABLE IF NOT EXISTS guest_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    event_id VARCHAR(120) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    guest_name VARCHAR(150),
    guest_phone VARCHAR(30),
    expires_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(255),
    max_scans INTEGER DEFAULT NULL,
    scan_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_passes_token_hash ON guest_passes (token_hash);
CREATE INDEX IF NOT EXISTS idx_guest_passes_event_id ON guest_passes (event_id);
CREATE INDEX IF NOT EXISTS idx_guest_passes_active ON guest_passes (event_id, is_revoked, expires_at);

-- 2. Face Search Sessions (Audit record of biometric search requests)
CREATE TABLE IF NOT EXISTS face_search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_pass_id UUID REFERENCES guest_passes(id) ON DELETE SET NULL,
    event_id VARCHAR(120) NOT NULL,
    matches_count INTEGER NOT NULL DEFAULT 0,
    highest_similarity NUMERIC(5, 4),
    latency_ms INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL CHECK (status IN ('SUCCESS', 'NO_MATCH', 'FAILED', 'RATE_LIMITED')),
    engine VARCHAR(60) NOT NULL DEFAULT 'shaadisnap-arcface-native',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_face_search_sessions_event ON face_search_sessions (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_face_search_sessions_pass ON face_search_sessions (guest_pass_id);

-- 3. Guest Access Logs (Strict DPDP Act & GDPR security access tracking)
CREATE TABLE IF NOT EXISTS guest_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_pass_id UUID REFERENCES guest_passes(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'PAGE_VIEW',
        'FACE_SCAN_INITIATED',
        'FACE_MATCH_SUCCESS',
        'FACE_MATCH_EMPTY',
        'PHOTO_DOWNLOAD_SINGLE',
        'PHOTO_DOWNLOAD_BATCH',
        'PASS_REVOKED'
    )),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_access_logs_pass ON guest_access_logs (guest_pass_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_guest_access_logs_action ON guest_access_logs (action);

-- 4. Photo Processing Jobs (Admin bulk upload & face embedding background pipeline)
CREATE TABLE IF NOT EXISTS photo_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(120) NOT NULL,
    photo_id VARCHAR(150) NOT NULL,
    photo_url TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    faces_detected INTEGER DEFAULT 0,
    error_message TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_photo_jobs_event_status ON photo_processing_jobs (event_id, status);
CREATE INDEX IF NOT EXISTS idx_photo_jobs_created ON photo_processing_jobs (created_at DESC);

-- Comments for schema documentation
COMMENT ON TABLE guest_passes IS 'Stores high-entropy unauthenticated guest passes with SHA-256 hashed tokens.';
COMMENT ON COLUMN guest_passes.token_hash IS 'SHA-256 hex digest of the 192-bit cryptographic guest token.';
COMMENT ON TABLE face_search_sessions IS 'Audit log of biometric face comparison searches without storing raw selfie images.';
COMMENT ON TABLE guest_access_logs IS 'DPDP / GDPR compliance audit log for guest activity.';
COMMENT ON TABLE photo_processing_jobs IS 'Asynchronous facial recognition indexing queue for uploaded wedding photographs.';

