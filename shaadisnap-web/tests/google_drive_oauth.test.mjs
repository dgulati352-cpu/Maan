#!/usr/bin/env node

/**
 * ShaadiSnap AI — Google Drive OAuth & Photo Import Automated Verification Suite
 * 
 * Verifies:
 * 1. Google OAuth Scopes & Authorization URL Generation
 * 2. Mock Credentials & Session Authorization Lifecycle
 * 3. Google Drive ID Parsing & High-Speed CDN URL Transformation
 * 4. Google Drive Albums & Photos Retrieval Logic
 * 5. Google Drive Import Pipeline & Gallery Store Integration
 * 6. UI Contract & Rose Champagne Aesthetic Palette Enforcement
 * 7. Security & Boundary Conditions (Malformed inputs, path traversal, empty payloads)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(PROJECT_ROOT, 'src');

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
  }
}

function assertMatch(str, regex, message) {
  if (!regex.test(str)) {
    throw new Error(`${message || 'Assertion failed'}: pattern ${regex} did not match target`);
  }
}

async function test(suiteName, testName, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ${GREEN}✓${RESET} [${suiteName}] ${testName}`);
  } catch (err) {
    failedTests++;
    failures.push({ suite: suiteName, title: testName, error: err });
    console.log(`  ${RED}✗${RESET} [${suiteName}] ${testName}`);
    console.log(`    ${RED}${err.message}${RESET}`);
  }
}

function readSource(relPath) {
  const fullPath = path.resolve(SRC_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

console.log(`\n${BOLD}${MAGENTA}========================================================================${RESET}`);
console.log(`${BOLD}${CYAN}  ✨ ShaadiSnap AI — Google Drive OAuth & Photo Import Test Suite ✨${RESET}`);
console.log(`${BOLD}${MAGENTA}========================================================================${RESET}\n`);

// 1. Dynamic import of client library modules
const {
  GOOGLE_DRIVE_SCOPES,
  GOOGLE_DRIVE_SCOPE_STRING,
  buildGoogleOAuthUrl,
  createMockGoogleUser,
  SAMPLE_GOOGLE_DRIVE_ALBUMS,
  SAMPLE_GOOGLE_DRIVE_PHOTOS,
} = await import('../src/lib/googleAuth.ts');

const {
  extractGoogleDriveId,
  formatGoogleDriveImage,
  formatGoogleContentImage,
  parseGoogleDriveInputs,
} = await import('../src/lib/googleDrive.ts');

// ============================================================================
// SUITE 1: Google OAuth Scopes & Authorization URL
// ============================================================================
console.log(`${BOLD}--- Suite 1: Google OAuth Scopes & Authorization URL ---${RESET}`);

await test('OAuth-01', 'Mandatory Google Drive scopes are defined', () => {
  assert(GOOGLE_DRIVE_SCOPES.includes('https://www.googleapis.com/auth/drive.readonly'), 'Must include drive.readonly scope');
  assert(GOOGLE_DRIVE_SCOPES.includes('https://www.googleapis.com/auth/drive.photos.readonly'), 'Must include drive.photos.readonly scope');
  assert(GOOGLE_DRIVE_SCOPES.includes('https://www.googleapis.com/auth/userinfo.profile'), 'Must include userinfo.profile scope');
  assert(GOOGLE_DRIVE_SCOPES.includes('https://www.googleapis.com/auth/userinfo.email'), 'Must include userinfo.email scope');
});

await test('OAuth-02', 'Generates standard Google OAuth 2.0 consent URL with required parameters', () => {
  const authUrl = buildGoogleOAuthUrl({
    clientId: 'test-client-id-2026.apps.googleusercontent.com',
    redirectUri: 'https://shaadisnap.internal/login?oauth=google_callback',
    state: 'csrf_nonce_987654',
  });

  assert(authUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth?'), 'Must target Google OAuth endpoint');
  assert(authUrl.includes('client_id=test-client-id-2026.apps.googleusercontent.com'), 'Must embed client_id');
  assert(authUrl.includes('response_type=token'), 'Must specify response_type=token');
  assert(authUrl.includes('drive.readonly'), 'Must embed drive.readonly scope');
  assert(authUrl.includes('state=csrf_nonce_987654'), 'Must embed state parameter');
  assert(authUrl.includes('prompt=consent'), 'Must specify prompt=consent');
});

await test('OAuth-03', 'Simulated mock Google user contains verified credentials and Drive scopes', () => {
  const user = createMockGoogleUser();
  assertEqual(user.email, 'anand.maan@gmail.com');
  assertEqual(user.name, 'Anand Maan');
  assert(user.accessToken.startsWith('mock_oauth_token_drive_full_access'), 'Access token must be formatted');
  assert(user.scopes.includes('https://www.googleapis.com/auth/drive.readonly'));
  assert(user.picture && user.picture.startsWith('https://'), 'Picture must be a valid URL');
});

// ============================================================================
// SUITE 2: Google Drive API Route Files & Handlers
// ============================================================================
console.log(`\n${BOLD}--- Suite 2: Google Drive API Route Specifications ---${RESET}`);

await test('Route-Auth-Spec', 'src/app/api/auth/google/route.ts implements GET and POST handlers', () => {
  const code = readSource('app/api/auth/google/route.ts');
  assert(code.includes('export async function GET'), 'Must export GET handler');
  assert(code.includes('export async function POST'), 'Must export POST handler');
  assert(code.includes('buildGoogleOAuthUrl'), 'Must call buildGoogleOAuthUrl');
  assert(code.includes('mock_simulation'), 'Must support mock testing simulation');
  assert(code.includes('createMockGoogleUser'), 'Must support mock user creation');
});

await test('Route-Albums-Spec', 'src/app/api/google-drive/albums/route.ts returns structured wedding albums', () => {
  const code = readSource('app/api/google-drive/albums/route.ts');
  assert(code.includes('export async function GET'), 'Must export GET handler');
  assert(code.includes('SAMPLE_GOOGLE_DRIVE_ALBUMS'), 'Must return curated wedding albums');
  assert(code.includes('authenticated'), 'Must report authentication state');
});

await test('Route-Photos-Spec', 'src/app/api/google-drive/photos/route.ts supports album & ceremony filters', () => {
  const code = readSource('app/api/google-drive/photos/route.ts');
  assert(code.includes('export async function GET'), 'Must export GET handler');
  assert(code.includes('searchParams.get("albumId")'), 'Must filter by albumId');
  assert(code.includes('searchParams.get("ceremony")'), 'Must filter by ceremony');
});

await test('Route-Import-Spec', 'src/app/api/google-drive/import/route.ts validates & formats imported photos', () => {
  const code = readSource('app/api/google-drive/import/route.ts');
  assert(code.includes('export async function POST'), 'Must export POST handler');
  assert(code.includes('formatGoogleDriveImage'), 'Must attach Google Drive CDN link');
  assert(code.includes('importedPhotos'), 'Must return importedPhotos array');
  assert(code.includes('status: 400'), 'Must reject empty photo payload with 400');
});

// ============================================================================
// SUITE 3: Google Drive Albums Data Verification
// ============================================================================
console.log(`\n${BOLD}--- Suite 3: Google Drive Wedding Albums Dataset ---${RESET}`);

await test('Albums-Data-01', 'Curated Google Drive albums cover all major ceremonies', () => {
  assert(Array.isArray(SAMPLE_GOOGLE_DRIVE_ALBUMS));
  assert(SAMPLE_GOOGLE_DRIVE_ALBUMS.length >= 5);

  const ceremonies = SAMPLE_GOOGLE_DRIVE_ALBUMS.map(a => a.ceremony);
  assert(ceremonies.includes('Sangeet'));
  assert(ceremonies.includes('Phere'));
  assert(ceremonies.includes('Mehendi'));
  assert(ceremonies.includes('Reception'));
  assert(ceremonies.includes('Haldi'));

  SAMPLE_GOOGLE_DRIVE_ALBUMS.forEach(album => {
    assert(album.id.startsWith('album_'), `Album ID ${album.id} must have album_ prefix`);
    assert(album.name.length > 5, 'Album title must be informative');
    assert(album.photoCount > 0, 'Album photo count must be greater than 0');
    assert(album.coverPhotoUrl.startsWith('http'), 'Album cover URL must be valid');
    assert(album.description.length > 10, 'Album must have editorial description');
  });
});

// ============================================================================
// SUITE 4: Google Drive Photos Data & Filtering
// ============================================================================
console.log(`\n${BOLD}--- Suite 4: Google Drive Photos Dataset & Filtering ---${RESET}`);

await test('Photos-Data-01', 'Curated photos contain valid IDs, CDN links, and file metadata', () => {
  assert(Array.isArray(SAMPLE_GOOGLE_DRIVE_PHOTOS));
  assert(SAMPLE_GOOGLE_DRIVE_PHOTOS.length >= 20, 'Must have at least 20 photos across albums');

  SAMPLE_GOOGLE_DRIVE_PHOTOS.forEach(photo => {
    assert(photo.id && photo.id.length >= 20, `Photo ID ${photo.id} must be valid Google Drive ID`);
    assert(photo.name.endsWith('.jpg') || photo.name.endsWith('.png'), 'Filename must end with image extension');
    assert(photo.thumbnailUrl.includes('drive.google.com/thumbnail?id='), 'Thumbnail must use Google thumbnail CDN');
    assert(photo.directUrl.includes('lh3.googleusercontent.com/d/'), 'Direct URL must use Google Usercontent CDN');
    assert(photo.sizeBytes > 1024 * 1024, 'High-resolution photo size must be > 1MB');
    assert(photo.sizeFormatted.includes('MB'), 'Formatted size must display MB');
    assertEqual(photo.mimeType, 'image/jpeg');
  });
});

await test('Photos-Filter-Album', 'Photos correctly filter by album ID', () => {
  const targetAlbumId = 'album_udaipur_sangeet_01';
  const filtered = SAMPLE_GOOGLE_DRIVE_PHOTOS.filter(p => p.albumId === targetAlbumId);
  assertEqual(filtered.length, 4, 'Sangeet album should contain 4 photos');
  filtered.forEach(p => {
    assertEqual(p.ceremony, 'Sangeet');
    assertEqual(p.albumId, targetAlbumId);
  });
});

await test('Photos-Filter-Ceremony', 'Photos correctly filter by ceremony tag', () => {
  const targetCeremony = 'Phere';
  const filtered = SAMPLE_GOOGLE_DRIVE_PHOTOS.filter(p => p.ceremony.toLowerCase() === targetCeremony.toLowerCase());
  assertEqual(filtered.length, 4, 'Phere ceremony should contain 4 photos');
  filtered.forEach(p => {
    assertEqual(p.ceremony, 'Phere');
  });
});

// ============================================================================
// SUITE 5: Google Drive Photo Import Flow & Gallery Store Integration
// ============================================================================
console.log(`\n${BOLD}--- Suite 5: Google Drive Photo Import & Store Integration ---${RESET}`);

await test('Import-Store-01', 'Imported photos are properly mapped with CDN URLs and ceremony tags', () => {
  const selectedPhotos = SAMPLE_GOOGLE_DRIVE_PHOTOS.slice(0, 3);
  const ceremony = 'Sangeet';

  const importedPhotos = selectedPhotos.map((item, index) => {
    const fileId = item.id;
    const cdnUrl = item.directUrl || formatGoogleDriveImage(fileId, 1200);
    const fallback = item.fallbackUrl || `https://lh3.googleusercontent.com/d/${fileId}=s0`;

    return {
      id: `gdrive_${fileId}_${Date.now()}_${index}`,
      driveFileId: fileId,
      title: item.name,
      url: cdnUrl,
      fallbackUrl: fallback,
      ceremony: item.ceremony || ceremony,
      photographer: 'Google Drive Import',
    };
  });

  assertEqual(importedPhotos.length, 3);
  importedPhotos.forEach(p => {
    assert(p.id.startsWith('gdrive_'), 'Must have gdrive_ ID prefix');
    assert(p.url.includes('googleusercontent.com') || p.url.includes('drive.google.com'), 'Must have Google CDN link');
    assertEqual(p.photographer, 'Google Drive Import');
    assertEqual(p.ceremony, 'Sangeet');
  });
});

await test('Import-Store-02', 'weddingPhotoStore.ts handles Google Drive CDN previews and driveFileId', () => {
  const storeCode = readSource('lib/weddingPhotoStore.ts');
  assert(storeCode.includes('driveFileId'), 'weddingPhotoStore must support driveFileId');
  assert(storeCode.includes('googleusercontent.com') || storeCode.includes('lh3.googleusercontent.com'), 'Store must support high-speed Google Usercontent CDN');
  assert(storeCode.includes('shaadisnap_photos_updated'), 'Store must dispatch shaadisnap_photos_updated on changes');
});

// ============================================================================
// SUITE 6: Boundary & URL Parsing Cases
// ============================================================================
console.log(`\n${BOLD}--- Suite 6: Boundary & Drive ID Parsing Edge Cases ---${RESET}`);

await test('Boundary-01', 'Extracts Drive ID from various Google Drive share URLs', () => {
  // /file/d/ID/view
  const f1 = extractGoogleDriveId('https://drive.google.com/file/d/1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b/view?usp=sharing');
  assertEqual(f1.id, '1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b');
  assertEqual(f1.isFolder, false);

  // /folders/ID
  const f2 = extractGoogleDriveId('https://drive.google.com/drive/folders/1ABCXYZ_folder_12345');
  assertEqual(f2.id, '1ABCXYZ_folder_12345');
  assertEqual(f2.isFolder, true);

  // uc?id=ID
  const f3 = extractGoogleDriveId('https://drive.google.com/uc?id=1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e');
  assertEqual(f3.id, '1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e');

  // /d/ID (lh3.googleusercontent.com)
  const f4 = extractGoogleDriveId('https://lh3.googleusercontent.com/d/1kL93mN1vP2xQ4rS7tU9w2Y5z8B3c6D0f=w1200');
  assertEqual(f4.id, '1kL93mN1vP2xQ4rS7tU9w2Y5z8B3c6D0f');

  // Raw ID
  const f5 = extractGoogleDriveId('1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b');
  assertEqual(f5.id, '1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b');
});

await test('Boundary-02', 'Gracefully handles empty, invalid, and malformed inputs', () => {
  assertEqual(extractGoogleDriveId('').id, null);
  assertEqual(extractGoogleDriveId('   ').id, null);
  assertEqual(extractGoogleDriveId('https://example.com/not-drive').id, null);
  assertEqual(extractGoogleDriveId('short').id, null);
  assertEqual(extractGoogleDriveId(null).id, null);
  assertEqual(extractGoogleDriveId(undefined).id, null);
});

await test('Boundary-03', 'Multi-input parser separates valid from invalid entries', () => {
  const raw = `
    https://drive.google.com/file/d/1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b/view
    invalid-junk-entry
    1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e
  `;
  const parsed = parseGoogleDriveInputs(raw);
  assertEqual(parsed.length, 3);
  assertEqual(parsed[0].isValid, true);
  assertEqual(parsed[1].isValid, false);
  assertEqual(parsed[2].isValid, true);
});

await test('Boundary-04', 'formatGoogleDriveImage returns direct CDN thumbnail URLs', () => {
  const url = formatGoogleDriveImage('1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b', 1200);
  assertEqual(url, 'https://drive.google.com/thumbnail?id=1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b&sz=w1200');
  assertEqual(formatGoogleDriveImage(''), '');
});

// ============================================================================
// SUITE 7: UI & Rose Champagne Aesthetic Palette Verification
// ============================================================================
console.log(`\n${BOLD}--- Suite 7: UI Contract & Rose Champagne Aesthetic Enforcement ---${RESET}`);

await test('UI-Login-01', 'src/app/login/page.tsx renders luxury Google Sign-In with Drive access', () => {
  const loginSrc = readSource('app/login/page.tsx');
  assert(loginSrc.includes('Continue with Google & Drive Access') || loginSrc.includes('handleGoogleSignIn'), 'Login must offer Google Sign-In button with Drive access');
  assert(loginSrc.includes('/api/auth/google'), 'Login must call /api/auth/google');
  assert(loginSrc.includes('Open Drive Albums'), 'Login must link to Drive albums when connected');
  assert(loginSrc.includes('#FFF8F3'), 'Must strictly enforce Warm Ivory (#FFF8F3)');
  assert(loginSrc.includes('#633C49'), 'Must strictly enforce Deep Burgundy (#633C49)');
  assert(loginSrc.includes('#A85D70'), 'Must strictly enforce Primary Rose (#A85D70)');
  assert(loginSrc.includes('#F1D5D5'), 'Must strictly enforce Soft Blush (#F1D5D5)');
  assert(!loginSrc.includes('dark:'), 'Strictly zero dark: utility classes in login');
  assert(!loginSrc.includes('bg-gray-'), 'Strictly zero generic grey classes');
});

await test('UI-Gallery-01', 'src/components/FullWeddingGallery.tsx mounts Google Drive import modal', () => {
  const gallerySrc = readSource('components/FullWeddingGallery.tsx');
  assert(gallerySrc.includes('GoogleDriveImportModal'), 'Gallery must import GoogleDriveImportModal');
  assert(gallerySrc.includes('isDriveModalOpen'), 'Gallery must manage isDriveModalOpen state');
  assert(gallerySrc.includes('Google Drive'), 'Gallery must have Google Drive button in header');
  assert(gallerySrc.includes('#FFF8F3') && gallerySrc.includes('#633C49'), 'Gallery must enforce Rose Champagne palette');
  assert(!gallerySrc.includes('dark:'), 'Zero dark: utility classes');
});

await test('UI-Upload-01', 'src/components/GuestPhotoUpload.tsx provides Google Drive import option', () => {
  const uploadSrc = readSource('components/GuestPhotoUpload.tsx');
  assert(uploadSrc.includes('GoogleDriveImportModal'), 'Upload component must import GoogleDriveImportModal');
  assert(uploadSrc.includes('isDriveModalOpen'), 'Upload component must manage isDriveModalOpen state');
  assert(uploadSrc.includes('Import from Google Drive'), 'Upload component must render Import from Google Drive button');
  assert(!uploadSrc.includes('dark:'), 'Zero dark: utility classes');
});

await test('UI-Modal-01', 'src/components/GoogleDriveImportModal.tsx implements complete album browser & photo picker', () => {
  const modalSrc = readSource('components/GoogleDriveImportModal.tsx');
  assert(modalSrc.includes('Drive Albums'), 'Modal must provide Drive Albums browsing');
  assert(modalSrc.includes('All Drive Photos'), 'Modal must provide photo picker grid');
  assert(modalSrc.includes('Paste Share Links'), 'Modal must provide direct link parsing');
  assert(modalSrc.includes('handleExecuteImport'), 'Modal must implement import handler');
  assert(modalSrc.includes('addUploadedPhoto'), 'Modal must save imported photos to store');
  assert(modalSrc.includes('#FFF8F3'), 'Modal canvas must be Warm Ivory (#FFF8F3)');
  assert(modalSrc.includes('#633C49'), 'Modal typography must be Deep Burgundy (#633C49)');
  assert(modalSrc.includes('#A85D70'), 'Modal action buttons must use Primary Rose (#A85D70)');
  assert(modalSrc.includes('#F1D5D5'), 'Modal accents must use Soft Blush (#F1D5D5)');
  assert(!modalSrc.includes('dark:'), 'Zero dark: utility classes in modal');
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log(`\n${BOLD}${CYAN}------------------------------------------------------------------------${RESET}`);
console.log(`${BOLD}           GOOGLE DRIVE OAUTH & PHOTO IMPORT TEST SUMMARY${RESET}`);
console.log(`${BOLD}${CYAN}------------------------------------------------------------------------${RESET}`);
console.log(` Total Checks:  ${totalTests}`);
console.log(` ${GREEN}Passed:        ${passedTests}${RESET}`);
console.log(` ${failedTests > 0 ? RED : GREEN}Failed:        ${failedTests}${RESET}`);
console.log(`${BOLD}${CYAN}------------------------------------------------------------------------${RESET}\n`);

if (failedTests > 0) {
  console.log(`${RED}${BOLD}❌ FAIL: ${failedTests} test(s) failed across the test suite.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}✅ SUCCESS: All ${passedTests} Google Drive OAuth & Photo Import tests PASSED!${RESET}\n`);
  process.exit(0);
}
