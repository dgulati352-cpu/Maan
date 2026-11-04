import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

console.log('========================================================================');
console.log('     🛡️  ADVERSARIAL STRESS TEST & PROBE HARNESS: MILESTONE 1  🛡️');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const findings = [];
const advisories = [];

function recordResult(name, passed, details = '') {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failedChecks++;
    console.error(`  ❌ FAIL: ${name}`);
    if (details) console.error(`     ↳ Details: ${details}`);
    findings.push({ name, details });
  }
}

function recordAdvisory(name, details = '') {
  console.log(`  ℹ️ ADVISORY (Next Milestones): ${name}`);
  if (details) console.log(`     ↳ Details: ${details}`);
  advisories.push({ name, details });
}

// Recursively get all files
function getAllFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extensions));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const targetFiles = getAllFiles(SRC_DIR, ['.tsx', '.ts', '.css']);
console.log(`Discovered ${targetFiles.length} source files under src/ to probe.\n`);

// -----------------------------------------------------------------------------
// Probe 1: Zero Dark Mode Toggles or dark: Tailwind Classes
// -----------------------------------------------------------------------------
console.log('--- Probe 1: Dark Mode Enforcement ---');

const darkModePatterns = [
  { pattern: /\bdark:/i, desc: 'Tailwind dark: utility class' },
  { pattern: /\bdark-mode\b/i, desc: 'dark-mode class or variable' },
  { pattern: /toggleDarkMode/i, desc: 'toggleDarkMode identifier' },
  { pattern: /theme\s*===\s*['"]dark['"]/i, desc: 'Dark theme conditional logic' },
  { pattern: /class(Name)?=['"][^'"]*\bdark\b[^'"]*['"]/i, desc: 'Explicit dark class in HTML/JSX' },
  { pattern: /classList\.(add|toggle)\(['"]dark['"]\)/i, desc: 'DOM dark class mutation' },
  { pattern: /prefers-color-scheme:\s*dark/i, desc: '@media prefers-color-scheme: dark query' },
];

let darkModeViolations = 0;
targetFiles.forEach(file => {
  const relPath = path.relative(SRC_DIR, file);
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  darkModePatterns.forEach(({ pattern, desc }) => {
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        darkModeViolations++;
        recordResult(`Dark mode pattern [${desc}] found in ${relPath}:${idx + 1}`, false, line.trim());
      }
    });
  });
});

if (darkModeViolations === 0) {
  recordResult('Zero dark mode toggles, classes, or queries across all src/ files', true);
}

// -----------------------------------------------------------------------------
// Probe 2: Legacy Hex Codes & Un-tokenized Greys
// -----------------------------------------------------------------------------
console.log('\n--- Probe 2: Legacy Hex & Un-tokenized Grey Purge ---');

// Mandatory M1 dispatch forbidden hexes
const mandatoryForbiddenHexes = [
  { hex: '242321', name: 'Legacy Charcoal' },
  { hex: 'DED5C8', name: 'Legacy Stone Border' },
  { hex: '716B63', name: 'Legacy Stone Text' },
  { hex: 'F8F5EF', name: 'Legacy Warm Cream' },
  { hex: '873F50', name: 'Legacy Wine/Burgundy' },
  { hex: 'C6A76A', name: 'Legacy Gold Accent' },
];

// Generic un-tokenized greys (Tailwind cool/slate/zinc/neutral/stone hexes)
const genericGreyHexes = [
  '1f2937', '111827', '374151', '4b5563', '6b7280', '9ca3af', 'd1d5db', 'e5e7eb', 'f3f4f6', 'f9fafb', // gray
  '18181b', '27272a', '3f3f46', '52525b', '71717a', 'a1a1aa', 'd4d4d8', 'e4e4e7', 'f4f4f5', // zinc
  '0f172a', '1e293b', '334155', '475569', '64748b', '94a3b8', 'cbd5e1', 'e2e8f0', 'f1f5f9', 'f8fafc', // slate
  '1c1917', '292524', '44403c', '57534e', '78716c', 'a8a29e', 'd6d3d1', 'e7e5e4', 'f5f5f4', 'fafaf9', // stone
  '737373', '525252', '404040', '262626', '171717', // neutral
  '808080', 'a9a9a9', 'd3d3d3' // web standard greys
];

let mandatoryViolations = 0;
targetFiles.forEach(file => {
  const relPath = path.relative(SRC_DIR, file);
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check mandatory forbidden hexes
    mandatoryForbiddenHexes.forEach(({ hex, name }) => {
      const regex = new RegExp(`(?:#|0x|\\b)${hex}\\b`, 'i');
      if (regex.test(line)) {
        mandatoryViolations++;
        recordResult(`Forbidden ${name} (#${hex}) found in ${relPath}:${idx + 1}`, false, line.trim());
      }
    });

    // Check generic un-tokenized greys
    genericGreyHexes.forEach(grey => {
      const regex = new RegExp(`(?:#|0x)${grey}\\b`, 'i');
      if (regex.test(line)) {
        mandatoryViolations++;
        recordResult(`Un-tokenized generic grey (#${grey}) found in ${relPath}:${idx + 1}`, false, line.trim());
      }
    });

    // Check auxiliary warm stone (#E8DDD0) in M2 component
    if (/#?E8DDD0\b/i.test(line)) {
      recordAdvisory(`Auxiliary Warm Stone (#E8DDD0) noted in ${relPath}:${idx + 1}`, line.trim());
    }
  });
});

if (mandatoryViolations === 0) {
  recordResult('Zero legacy hex codes (#242321, #DED5C8, #716B63, #F8F5EF, #873F50, #C6A76A) and un-tokenized greys', true);
}

// -----------------------------------------------------------------------------
// Probe 3: Generic Grey Tailwind Classes
// -----------------------------------------------------------------------------
console.log('\n--- Probe 3: Generic Grey Tailwind Utility Classes ---');

const greyClassRegex = /\b(?:[a-z0-9_-]+:)*(?:bg|text|border|ring|divide|from|to|via|fill|stroke)-(?:gray|stone|slate|zinc|neutral)-(?:[0-9]{2,3}|50)\b/i;
const standaloneGreyRegex = /\b(?:[a-z0-9_-]+:)*(?:gray|stone|slate|zinc|neutral)-(?:[0-9]{2,3}|50)\b/i;

let greyClassViolations = 0;
targetFiles.forEach(file => {
  const relPath = path.relative(SRC_DIR, file);
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const match1 = line.match(greyClassRegex);
    const match2 = line.match(standaloneGreyRegex);
    const match = match1 || match2;
    if (match) {
      greyClassViolations++;
      recordResult(`Generic grey Tailwind utility [${match[0]}] found in ${relPath}:${idx + 1}`, false, line.trim());
    }
  });
});

if (greyClassViolations === 0) {
  recordResult('Zero generic grey classes (gray-*, stone-*, slate-*, zinc-*, neutral-*) across all src/ files', true);
}

// -----------------------------------------------------------------------------
// Probe 4: Accessibility & Motion in globals.css
// -----------------------------------------------------------------------------
console.log('\n--- Probe 4: Accessibility & Motion (@media prefers-reduced-motion) ---');

const globalsCssPath = path.join(SRC_DIR, 'app/globals.css');
const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');

// 4.1 Check .animate-scan is disabled under prefers-reduced-motion
const reducedMotionScanMatch = globalsCss.match(
  /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([^}]*\.animate-scan\s*\{[^}]*\})[^}]*\}/s
);

if (reducedMotionScanMatch) {
  const innerRule = reducedMotionScanMatch[1];
  const hasAnimationNone = /animation:\s*none\s*!important/i.test(innerRule);
  const hasIterationCount1 = /animation-iteration-count:\s*1\s*!important/i.test(innerRule);
  recordResult('globals.css: .animate-scan disabled with animation: none !important', hasAnimationNone);
  recordResult('globals.css: .animate-scan capped with animation-iteration-count: 1 !important', hasIterationCount1);
} else {
  const hasScanInReduced = /@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*\{[\s\S]*?\.animate-scan[\s\S]*?animation:\s*none\s*!important;[\s\S]*?\}/.test(globalsCss);
  recordResult('globals.css: @media (prefers-reduced-motion: reduce) handles .animate-scan', hasScanInReduced);
}

// 4.2 Check universal animation duration cap to 0.01ms
const reducedMotionUniversalMatch = globalsCss.match(
  /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?(\*,\s*::before,\s*::after\s*\{[^}]*\})/
);

if (reducedMotionUniversalMatch) {
  const universalBlock = reducedMotionUniversalMatch[1];
  const capsAnimDuration = /animation-duration:\s*0\.01ms\s*!important/i.test(universalBlock);
  const capsTransDuration = /transition-duration:\s*0\.01ms\s*!important/i.test(universalBlock);
  const capsAnimIteration = /animation-iteration-count:\s*1\s*!important/i.test(universalBlock);
  const resetsScroll = /scroll-behavior:\s*auto\s*!important/i.test(universalBlock);

  recordResult('globals.css: Universal animation-duration capped to 0.01ms !important', capsAnimDuration);
  recordResult('globals.css: Universal transition-duration capped to 0.01ms !important', capsTransDuration);
  recordResult('globals.css: Universal animation-iteration-count capped to 1 !important', capsAnimIteration);
  recordResult('globals.css: Universal scroll-behavior reset to auto !important', resetsScroll);
} else {
  recordResult('globals.css: Universal reduced motion block (*, ::before, ::after) exists', false);
}

// 4.3 Check motion.ts programmatic reduced-motion compliance
const motionTsPath = path.join(SRC_DIR, 'lib/motion.ts');
const motionTs = fs.readFileSync(motionTsPath, 'utf-8');

const hasGetLuxuryTransitionReduced = /if\s*\(shouldReduceMotion\)\s*\{\s*return\s*\{\s*duration:\s*0\.01,\s*ease:\s*["']linear["']\s*\};\s*\}/.test(motionTs);
recordResult('motion.ts: getLuxuryTransition collapses duration to 0.01s on reduced motion', hasGetLuxuryTransitionReduced);

const hasFadeInUpReduced = /y:\s*shouldReduceMotion\s*\?\s*0\s*:\s*10/.test(motionTs);
recordResult('motion.ts: fadeInUpVariants eliminates vertical translation on reduced motion', hasFadeInUpReduced);

const hasModalContentReduced = /scale:\s*shouldReduceMotion\s*\?\s*1\s*:\s*0\.98/.test(motionTs);
recordResult('motion.ts: modalContentVariants eliminates scaling distortion on reduced motion', hasModalContentReduced);

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalChecks}`);
console.log(`PASSED: ${passedChecks}`);
console.log(`FAILED: ${failedChecks}`);
console.log(`ADVISORIES: ${advisories.length}`);
console.log(`VERDICT: ${failedChecks === 0 ? '🏆 APPROVE' : '⚠️ CHALLENGE_FAILED'}`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
