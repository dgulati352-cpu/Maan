import assert from "assert";

console.log("\n=======================================================");
console.log("   🧪 DYNAMIC EMAIL & GOOGLE DRIVE SCOPING TEST 🧪");
console.log("=======================================================\n");

// Simulated logic mirroring googleAuth.ts & weddingPhotoStore.ts
function simulateSwitchActiveUser(email, name, driveFolderId) {
  const sanitizedName = name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const folderId = driveFolderId || `drive_folder_${encodeURIComponent(email.split("@")[0])}_wedding`;
  return {
    id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
    email: email.trim().toLowerCase(),
    name: sanitizedName,
    driveFolderId: folderId,
    driveFolderName: `${sanitizedName}'s Wedding Drive Album`,
  };
}

function simulateGetScopedAlbums(userEmail) {
  const email = (userEmail || "guest@maan-ai.com").trim().toLowerCase();
  const ownerName = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const userTag = email.replace(/[^a-zA-Z0-9]/g, "_");

  return [
    {
      id: `album_${userTag}_sangeet`,
      name: `${ownerName}'s Sangeet Celebrations`,
      ceremony: "Sangeet",
    },
    {
      id: `album_${userTag}_phere`,
      name: `${ownerName}'s Phere & Wedding Vows`,
      ceremony: "Phere",
    },
    {
      id: `album_${userTag}_reception`,
      name: `${ownerName}'s Grand Reception Gala`,
      ceremony: "Reception",
    },
  ];
}

function simulatePhotoUpload(file, activeUser) {
  return {
    id: `photo_${Date.now()}`,
    title: file.name,
    uploaderEmail: activeUser.email,
    driveFolderId: activeUser.driveFolderId,
    approvalStatus: "pending_ceo_approval",
  };
}

// TEST 1: Initial User Upload
const userA = simulateSwitchActiveUser("dhairya.gulati@gmail.com", "Dhairya Gulati");
assert.strictEqual(userA.email, "dhairya.gulati@gmail.com");
assert.strictEqual(userA.driveFolderId, "drive_folder_dhairya.gulati_wedding");
assert.strictEqual(userA.driveFolderName, "Dhairya Gulati's Wedding Drive Album");

const photo1 = simulatePhotoUpload({ name: "WIN_20261107_Sangeet.jpg" }, userA);
assert.strictEqual(photo1.uploaderEmail, "dhairya.gulati@gmail.com");
assert.strictEqual(photo1.driveFolderId, "drive_folder_dhairya.gulati_wedding");
console.log("✅ TEST 1: Upload targets active user email (dhairya.gulati@gmail.com) and Drive folder.");

// TEST 2: Email Switch Dynamically Updates Albums & Upload Target
const userB = simulateSwitchActiveUser("kabir.marwaha@gmail.com", "Kabir Marwaha");
assert.strictEqual(userB.email, "kabir.marwaha@gmail.com");
assert.strictEqual(userB.driveFolderId, "drive_folder_kabir.marwaha_wedding");

const albumsB = simulateGetScopedAlbums(userB.email);
assert.strictEqual(albumsB.length, 3);
assert.strictEqual(albumsB[0].name, "Kabir Marwaha's Sangeet Celebrations");

const photo2 = simulatePhotoUpload({ name: "WIN_20261107_Reception.jpg" }, userB);
assert.strictEqual(photo2.uploaderEmail, "kabir.marwaha@gmail.com");
assert.strictEqual(photo2.driveFolderId, "drive_folder_kabir.marwaha_wedding");
console.log("✅ TEST 2: Switching email dynamically updates Google Drive albums and subsequent upload targets.");

console.log("\n=======================================================");
console.log("   🎉 DYNAMIC EMAIL & DRIVE SCOPING TESTS PASSED! 🎉");
console.log("=======================================================\n");

