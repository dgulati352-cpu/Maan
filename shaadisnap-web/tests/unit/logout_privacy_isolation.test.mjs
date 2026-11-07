import assert from "assert";

console.log("\n=======================================================");
console.log("   🧪 LOGOUT PRIVACY ISOLATION & LEADERSHIP ACCESS TEST 🧪");
console.log("=======================================================\n");

// Mock Local Storage Photo Store
let mockLocalStoragePhotos = [
  {
    id: "hero_couple_photo",
    title: "Marwaha & Gulati Wedding",
    approvalStatus: "approved",
  },
  {
    id: "upload_user_a_1",
    title: "WIN_user_a_photo.jpg",
    uploaderEmail: "guest_a@gmail.com",
    photographer: "Guest Live Upload",
    approvalStatus: "pending_ceo_approval",
  },
  {
    id: "upload_user_b_1",
    title: "WIN_user_b_photo.jpg",
    uploaderEmail: "guest_b@gmail.com",
    photographer: "Guest Live Upload",
    approvalStatus: "pending_ceo_approval",
  },
];

function simulateClearUserSessionPhotos(targetEmail) {
  const emailToClear = targetEmail?.trim().toLowerCase();
  mockLocalStoragePhotos = mockLocalStoragePhotos.filter((p) => {
    if (p.id === "hero_couple_photo") return true;
    if (emailToClear && p.uploaderEmail) {
      return p.uploaderEmail.toLowerCase() !== emailToClear;
    }
    return p.photographer !== "Guest Live Upload" && !p.uploaderEmail;
  });
}

function simulateGetPhotosForCurrentUser(currentUser) {
  if (!currentUser || !currentUser.email) {
    // Unauthenticated: strictly public approved photos
    return mockLocalStoragePhotos.filter((p) => p.approvalStatus === "approved" || p.id === "hero_couple_photo");
  }

  const userEmail = currentUser.email.toLowerCase();
  const isOrganizer =
    currentUser.scopes?.includes("admin") ||
    currentUser.scopes?.includes("organizer") ||
    userEmail.includes("admin") ||
    userEmail.includes("marwaha") ||
    userEmail.includes("gulati") ||
    userEmail.includes("kabir") ||
    userEmail.includes("dhairya") ||
    userEmail.includes("simran");

  if (isOrganizer) {
    return mockLocalStoragePhotos;
  }

  return mockLocalStoragePhotos.filter((p) => {
    if (p.id === "hero_couple_photo") return true;
    if (p.approvalStatus === "approved") return true;
    if (p.uploaderEmail && p.uploaderEmail.toLowerCase() === userEmail) return true;
    return false;
  });
}

// TEST 1: Signed-in User A sees approved photos + their own uploads
const userA = { email: "guest_a@gmail.com", scopes: ["profile", "email"] };
const viewA = simulateGetPhotosForCurrentUser(userA);
assert.strictEqual(viewA.length, 2, "User A should see couple photo + their own upload");
assert.ok(viewA.some((p) => p.id === "upload_user_a_1"));
assert.ok(!viewA.some((p) => p.id === "upload_user_b_1"), "User A should NOT see User B's unapproved private upload");
console.log("✅ TEST 1: User A sees only their scoped upload and approved couple portrait.");

// TEST 2: User A Logs Out -> Session Photos are Purged from Local State
simulateClearUserSessionPhotos(userA.email);
assert.ok(!mockLocalStoragePhotos.some((p) => p.id === "upload_user_a_1"), "User A's upload must be purged from local storage on logout");
console.log("✅ TEST 2: On logout, User A's uploads are purged from local gallery state.");

// TEST 3: Unauthenticated / Logged-out view has zero private uploads
const unauthView = simulateGetPhotosForCurrentUser(null);
assert.strictEqual(unauthView.length, 1);
assert.strictEqual(unauthView[0].id, "hero_couple_photo");
console.log("✅ TEST 3: Logged-out guest sees strictly public approved celebration photos.");

// TEST 4: Executive Leadership (CEO Kabir Marwaha / CTO Dhairya Gulati) maintains full oversight
const ceoUser = { email: "kabir.marwaha@maan-ai.com", scopes: ["admin", "organizer"] };
const ceoView = simulateGetPhotosForCurrentUser(ceoUser);
assert.strictEqual(ceoView.length, mockLocalStoragePhotos.length, "CEO must see all photos in master station");
console.log("✅ TEST 4: Executive Leadership (CEO/CTO/CFO) retains master station oversight across all photos.");

console.log("\n=======================================================");
console.log("   🎉 ALL 4 LOGOUT PRIVACY ISOLATION TESTS PASSED! 🎉");
console.log("=======================================================\n");

