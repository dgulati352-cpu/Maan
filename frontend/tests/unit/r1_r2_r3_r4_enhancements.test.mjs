// Automated Unit & Integration Tests for R1, R2, R3, R4 Enhancements
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../..");
const webSrcDir = path.join(rootDir, "shaadisnap-web/src");

console.log("\n========================================================================");
console.log("   💎 ENHANCEMENT SUITE: R1, R2, R3 & R4 VERIFICATION TESTS 💎");
console.log("========================================================================\n");

let passedChecks = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedChecks++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// R1: SHAREABLE GUEST LINK & QR CODE GENERATION
// -----------------------------------------------------------------------------
console.log("--- SUITE 1: SHAREABLE GUEST LINK & CLIENT-SIDE QR GENERATOR ---");

const qrSvgFile = path.join(webSrcDir, "lib/qrCodeSvg.tsx");
const qrSvgSource = fs.readFileSync(qrSvgFile, "utf-8");

check("R1-01: Pure client-side mathematical QR matrix generator (zero external network calls)", () => {
  assert(qrSvgSource.includes("function encodeToQrMatrix"), "Must export encodeToQrMatrix function");
  assert(qrSvgSource.includes("rsComputeRemainder"), "Must implement genuine Reed-Solomon polynomial math");
  assert(qrSvgSource.includes("placeFinder"), "Must construct finder patterns");
  assert(!qrSvgSource.includes("api.qrserver.com"), "Must NOT rely on external QR API");
  assert(!qrSvgSource.includes("chart.googleapis.com"), "Must NOT rely on Google Chart API");
});

const shareModalFile = path.join(webSrcDir, "components/ShareGuestLinkModal.tsx");
const shareModalSource = fs.readFileSync(shareModalFile, "utf-8");

check("R1-02: ShareGuestLinkModal provides copy-to-clipboard with 3-second state & feedback", () => {
  assert(shareModalSource.includes("navigator.clipboard"), "Must use navigator.clipboard API");
  assert(shareModalSource.includes("3000"), "Must set 3-second timeout for copied confirmation");
  assert(shareModalSource.includes("Link Copied!"), "Must render Link Copied! confirmation text");
});

check("R1-03: ShareGuestLinkModal provides WhatsApp share intent with Solan wedding invitation", () => {
  assert(shareModalSource.includes("api.whatsapp.com/send"), "Must implement WhatsApp universal send intent");
  assert(shareModalSource.includes("Marwaha & Gulati Wedding Celebration"), "Must reference Marwaha & Gulati couple");
  assert(shareModalSource.includes("Deventure Shimla Hills Resort, Solan (HP)"), "Must reference Solan venue");
});

check("R1-04: ShareGuestLinkModal triggers wired into Navbar, Hero, GuestSelfieSearch, FullWeddingGallery", () => {
  const navbarSource = fs.readFileSync(path.join(webSrcDir, "components/layout/Navbar.tsx"), "utf-8");
  const heroSource = fs.readFileSync(path.join(webSrcDir, "components/Hero.tsx"), "utf-8");
  const selfieSource = fs.readFileSync(path.join(webSrcDir, "components/GuestSelfieSearch.tsx"), "utf-8");
  const gallerySource = fs.readFileSync(path.join(webSrcDir, "components/FullWeddingGallery.tsx"), "utf-8");

  assert(navbarSource.includes("ShareGuestLinkModal"), "Navbar must mount ShareGuestLinkModal");
  assert(navbarSource.includes("Share Guest Link"), "Navbar must include Share Guest Link trigger");
  assert(heroSource.includes("ShareGuestLinkModal"), "Hero must mount ShareGuestLinkModal");
  assert(heroSource.includes("Share Guest Pass"), "Hero must include Share trigger button");
  assert(selfieSource.includes("ShareGuestLinkModal"), "GuestSelfieSearch must mount ShareGuestLinkModal");
  assert(gallerySource.includes("ShareGuestLinkModal"), "FullWeddingGallery must mount ShareGuestLinkModal");
});

// -----------------------------------------------------------------------------
// R2: DEDICATED LUXURY EXECUTIVE LEADERSHIP & CEO APPROVAL FLOW
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 2: EXECUTIVE LEADERSHIP SECTION & CEO APPROVAL FLOW ---");

const leadershipFile = path.join(webSrcDir, "components/ExecutiveLeadershipSection.tsx");
const leadershipSource = fs.readFileSync(leadershipFile, "utf-8");

check("R2-01: ExecutiveLeadershipSection showcases all 8 realistic organizing profiles", () => {
  const requiredMembers = [
    "Kabir Marwaha",
    "Dhairya Gulati",
    "Simran Marwaha",
    "Ananya Gulati",
    "Rajeshwari Anand",
    "Chef Vikramaditya Rathore",
    "Meera Kapoor",
    "Joseph Matthew",
  ];
  for (const name of requiredMembers) {
    assert(leadershipSource.includes(name), `Must feature leadership member: ${name}`);
  }
});

check("R2-02: ExecutiveLeadershipSection highlights CEO Kabir Marwaha approval authority & credentials", () => {
  assert(leadershipSource.includes("Chief Executive Officer & Grand Host"), "Must display CEO title");
  assert(leadershipSource.includes("Final CEO Approval Authority"), "Must display CEO clearance");
  assert(leadershipSource.includes("Ask CEO for Approval"), "Must display interactive Ask CEO trigger button");
});

const ceoModalFile = path.join(webSrcDir, "components/CeoApprovalModal.tsx");
const ceoModalSource = fs.readFileSync(ceoModalFile, "utf-8");

check("R2-03: CeoApprovalModal implements multi-step simulation, confetti, and VIP authorization pass", () => {
  assert(ceoModalSource.includes("Transmitting to CEO Desk..."), "Must include transmitting state");
  assert(ceoModalSource.includes("Verifying credentials"), "Must include verification state");
  assert(ceoModalSource.includes("CEO_APPROVED"), "Must produce CEO_APPROVED status");
  assert(ceoModalSource.includes("CEO-AUTH-2026-MG"), "Must generate CEO-AUTH pass prefix");
  assert(ceoModalSource.includes("canvas-confetti"), "Must trigger confetti on approval");
  assert(ceoModalSource.includes("shaadisnap_ceo_approvals"), "Must persist approval to localStorage");
});

check("R2-04: ExecutiveLeadershipSection is embedded on landing page (src/app/page.tsx)", () => {
  const pageSource = fs.readFileSync(path.join(webSrcDir, "app/page.tsx"), "utf-8");
  assert(pageSource.includes("<ExecutiveLeadershipSection />"), "page.tsx must embed <ExecutiveLeadershipSection />");
  const statsIdx = pageSource.indexOf("<StatsSection />");
  const leadIdx = pageSource.indexOf("<ExecutiveLeadershipSection />");
  const schedIdx = pageSource.indexOf("<EventScheduleSection />");
  assert(statsIdx < leadIdx && leadIdx < schedIdx, "Must be positioned between StatsSection and EventScheduleSection");
});

// -----------------------------------------------------------------------------
// R3: GALLERY CLEANUP & VENUE STRING CONSISTENCY
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 3: GALLERY CLEANUP & VENUE STRING HARMONIZATION ---");

check("R3-01: Guest Upload Photos button is removed from /gallery", () => {
  const gallerySource = fs.readFileSync(path.join(webSrcDir, "components/FullWeddingGallery.tsx"), "utf-8");
  const galleryPageSource = fs.readFileSync(path.join(webSrcDir, "app/gallery/page.tsx"), "utf-8");

  assert(!gallerySource.includes("<span>Upload Photos</span>"), "FullWeddingGallery must not render guest upload button");
  assert(!galleryPageSource.includes('onUploadPhotos'), "gallery/page.tsx must not pass onUploadPhotos prop");
});

check("R3-02: Master photo upload is retained for administrators/organizers in /admin", () => {
  const adminPageSource = fs.readFileSync(path.join(webSrcDir, "app/admin/page.tsx"), "utf-8");
  assert(adminPageSource.includes("/upload-photos"), "Admin must provide link to master photo upload");
});

check("R3-03: Zero occurrences of 'royal Udaipur celebration' in src/", () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        scanDir(full);
      } else if (e.isFile() && (e.name.endsWith(".tsx") || e.name.endsWith(".ts"))) {
        const content = fs.readFileSync(full, "utf-8");
        assert(
          !content.includes("royal Udaipur celebration"),
          `File ${full} still contains 'royal Udaipur celebration'`
        );
      }
    }
  }
  scanDir(webSrcDir);
});

// -----------------------------------------------------------------------------
// R4: CEO / ORGANIZER APPROVAL WORKFLOW
// -----------------------------------------------------------------------------
console.log("\n--- SUITE 4: CEO / ORGANIZER APPROVAL WORKFLOW IN STORE & ADMIN ---");

const storeFile = path.join(webSrcDir, "lib/weddingPhotoStore.ts");
const storeSource = fs.readFileSync(storeFile, "utf-8");

check("R4-01: WeddingPhoto model & store support approvalStatus ('pending_ceo_approval' vs 'approved')", () => {
  assert(storeSource.includes("pending_ceo_approval"), "Must support pending_ceo_approval status");
  assert(storeSource.includes("getApprovedWeddingPhotos"), "Must export getApprovedWeddingPhotos for public views");
  assert(storeSource.includes("approvePhoto"), "Must export approvePhoto function");
  assert(storeSource.includes("batchApprovePhotos"), "Must export batchApprovePhotos function");
});

check("R4-02: Public galleries use getApprovedWeddingPhotos to keep unapproved photos private", () => {
  const fullGallerySource = fs.readFileSync(path.join(webSrcDir, "components/FullWeddingGallery.tsx"), "utf-8");
  const previewSource = fs.readFileSync(path.join(webSrcDir, "components/LuxuryGalleryPreview.tsx"), "utf-8");

  assert(fullGallerySource.includes("getApprovedWeddingPhotos"), "FullWeddingGallery must load only approved photos");
  assert(previewSource.includes("getApprovedWeddingPhotos"), "LuxuryGalleryPreview must load only approved photos");
});

check("R4-03: Admin Portal renders CEO Master Approval Station, badges, and guest link switch", () => {
  const adminPageSource = fs.readFileSync(path.join(webSrcDir, "app/admin/page.tsx"), "utf-8");

  assert(adminPageSource.includes("CEO Master Approval Station"), "Must render CEO Master Approval Station");
  assert(adminPageSource.includes("Pending CEO Review"), "Must render Pending CEO Review badge");
  assert(adminPageSource.includes("Approved by CEO"), "Must render Approved by CEO badge");
  assert(adminPageSource.includes("1-Click CEO Batch Approve"), "Must provide 1-click batch approve action");
  assert(adminPageSource.includes("Guest Link Access (/find-photos)"), "Must provide guest link access toggle");
});

console.log("\n========================================================================");
console.log(`TOTAL ENHANCEMENT CHECKS: ${passedChecks} | ALL PASSED! 🚀`);
console.log("========================================================================\n");
