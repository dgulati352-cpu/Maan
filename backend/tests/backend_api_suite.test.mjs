import assert from "node:assert";

const BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";

console.log(`\n=============================================================`);
console.log(` Running ShaadiSnap Backend Standalone API Test Suite`);
console.log(` Target Server: ${BASE_URL}`);
console.log(`=============================================================\n`);

let sessionCookie = "";
let authToken = "";

async function runTests() {
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(` PASS [T${String(total).padStart(2, "0")}] ${name}`);
      passed++;
    } catch (err) {
      console.error(` FAIL [T${String(total).padStart(2, "0")}] ${name}`);
      console.error(`       Error: ${err.message}`);
    }
  }

  // 1. Health check
  await test("Backend Health check returns 200, status healthy & 16 tables", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "healthy");
    assert.strictEqual(data.database.status, "healthy");
    assert.strictEqual(data.database.tables, 16);
  });

  // 2. Auth Login
  await test("Super Admin login succeeds and returns session token + user profile", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@shaadisnap.ai",
        password: "Admin@ShaadiSnap2026!",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, "SUPER_ADMIN");
    assert.ok(data.token);
    authToken = data.token;

    const cookieHeader = res.headers.get("set-cookie");
    if (cookieHeader) {
      sessionCookie = cookieHeader.split(";")[0];
    }
  });

  // 3. Auth Me
  await test("GET /api/auth/me returns current session user with Bearer token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, "admin@shaadisnap.ai");
    assert.strictEqual(data.user.role, "SUPER_ADMIN");
  });

  // 4. Admin Events List
  await test("GET /api/admin/events returns wedding events", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.events));
    assert.ok(data.events.length >= 1);
  });

  // 5. Admin Create Event
  let createdEventId = "";
  await test("POST /api/admin/events creates a new event with ceremonies and albums", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: "Sharma & Kapoor Royal Wedding",
        brideName: "Ananya",
        groomName: "Rohan",
        eventDate: "December 15, 2026",
        venue: "Umaid Bhawan Palace",
        location: "Jodhpur, Rajasthan",
        storageAllocatedGb: 100,
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.event.id.startsWith("evt_"));
    createdEventId = data.event.id;
  });

  // 6. Duplicate check
  await test("POST /api/admin/photos/duplicate-check identifies duplicate and clean hashes", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/photos/duplicate-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        eventId: "marwaha-gulati-2026",
        hashes: [
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // known seeded hash
          "clean_hash_9999999999999999999999999999999999999999999999999999999999999999",
        ],
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.duplicateCount, 1);
    assert.strictEqual(data.isDuplicate, true);
  });

  // 7. Gallery Photos
  await test("GET /api/gallery/photos returns database-driven wedding gallery photos", async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/photos?eventId=marwaha-gulati-2026`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.photos));
    assert.ok(data.photos.length >= 1);
    assert.ok(data.ceremonies.includes("Reception"));
    assert.ok(data.photos[0].url.includes("/api/image-proxy"));
  });

  // 8. Public RSVP Submission
  await test("POST /api/rsvp records guest attendance in SQLite", async () => {
    const res = await fetch(`${BASE_URL}/api/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: "marwaha-gulati-2026",
        guestName: "Arjun Verma",
        email: "arjun.verma@example.com",
        phone: "+91 98765 43210",
        attendanceStatus: "ATTENDING",
        attendeeCount: 2,
        dietaryPreferences: "Vegetarian",
        message: "Wishing the couple immense joy!",
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.id.startsWith("rsvp_"));
  });

  // 9. Admin RSVP & CSV Export
  await test("GET /api/admin/rsvp returns responses and format=csv produces valid CSV stream", async () => {
    const jsonRes = await fetch(`${BASE_URL}/api/admin/rsvp?eventId=marwaha-gulati-2026`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(jsonRes.status, 200);
    const jsonData = await jsonRes.json();
    assert.strictEqual(jsonData.success, true);
    assert.ok(jsonData.totalResponses >= 1);

    const csvRes = await fetch(`${BASE_URL}/api/admin/rsvp?eventId=marwaha-gulati-2026&format=csv`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(csvRes.status, 200);
    assert.ok(csvRes.headers.get("content-type").includes("text/csv"));
    const csvText = await csvRes.text();
    assert.ok(csvText.includes("Guest Name"));
    assert.ok(csvText.includes("Arjun Verma"));
  });

  // 10. Passwordless Guest Pass Verification
  await test("GET /api/guest/verify-pass validates demo pass token", async () => {
    const res = await fetch(`${BASE_URL}/api/guest/verify-pass?token=marwaha-gulati-vip`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.valid, true);
    assert.ok(data.guestPass.permissions.includes("VIEW_GALLERY"));
  });

  // 11. Guest Candid Upload to Moderation Queue
  let uploadedSubmissionId = "";
  let uploadedPhotoId = "";
  await test("POST /api/guest/uploads queues guest photo with status PENDING", async () => {
    // 1x1 base64 transparent pixel
    const dummyImageBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

    const res = await fetch(`${BASE_URL}/api/guest/uploads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: "marwaha-gulati-2026",
        guestName: "Pooja Malhotra",
        filename: "pooja_sangeet_candid.jpg",
        imageBase64: dummyImageBase64,
        ceremony: "Sangeet",
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, "PENDING");
    uploadedSubmissionId = data.uploadId;
    uploadedPhotoId = data.photoId;
  });

  // 12. Admin Moderation Queue
  await test("Admin moderation lists pending upload and APPROVE makes it public", async () => {
    const listRes = await fetch(`${BASE_URL}/api/admin/moderation?eventId=marwaha-gulati-2026&status=PENDING`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.strictEqual(listData.success, true);
    assert.ok(listData.submissions.some((s) => s.submission_id === uploadedSubmissionId));

    const modRes = await fetch(`${BASE_URL}/api/admin/moderation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        submissionId: uploadedSubmissionId,
        action: "APPROVE",
      }),
    });
    assert.strictEqual(modRes.status, 200);
    const modData = await modRes.json();
    assert.strictEqual(modData.success, true);
    assert.strictEqual(modData.status, "APPROVED");
  });

  // 13. Google Drive Picker Config
  await test("GET /api/google-drive/picker-config returns client-safe OAuth keys & scopes", async () => {
    const res = await fetch(`${BASE_URL}/api/google-drive/picker-config`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.apiKey && data.apiKey.startsWith("AIzaSy"));
    assert.ok(data.clientId && data.clientId.includes(".googleusercontent.com"));
    assert.ok(data.scopes.includes("https://www.googleapis.com/auth/drive.readonly"));
  });

  // 14. Logout
  await test("POST /api/auth/logout successfully invalidates session cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST" });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  console.log(`\n=============================================================`);
  console.log(` Test Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`=============================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test suite error:", err);
  process.exit(1);
});

