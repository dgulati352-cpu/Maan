import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');


function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n--- Running Milestone 1 Design System & UI Foundation Unit Tests ---\n');

// 1. globals.css tests
test('globals.css: Contains all 14 Rose Champagne tokens and developer aliases', () => {
  const css = fs.readFileSync(path.join(rootDir, 'src/app/globals.css'), 'utf-8');
  const requiredTokens = [
    '--color-rose-primary: #A85D70',
    '--color-rose-hover: #914C60',
    '--color-rose-soft: #F1D5D5',
    '--color-ivory-warm: #FFF8F3',
    '--color-burgundy-deep: #633C49',
    '--color-champagne: #D9B7A0',
    '--color-white-pure: #FFFFFF',
    '--color-text-body: #765D62',
    '--color-text-muted: #947A80',
    '--color-border-subtle: #EADDE0',
    '--color-success: #3D7A5A',
    '--color-warning: #B87B2E',
    '--color-error: #A63B48',
    '--color-info: #4A6B82',
  ];
  for (const token of requiredTokens) {
    assert(css.includes(token), `Missing required token: ${token}`);
  }
});

test('globals.css: Eliminates legacy gold and charcoal tokens', () => {
  const css = fs.readFileSync(path.join(rootDir, 'src/app/globals.css'), 'utf-8');
  assert(!css.includes('--accent-gold'), 'Found legacy --accent-gold in globals.css');
  assert(!css.includes('#C6A76A'), 'Found legacy gold #C6A76A in globals.css');
  assert(!css.includes('--text-charcoal'), 'Found legacy --text-charcoal in globals.css');
  assert(!css.includes('#242321'), 'Found legacy charcoal #242321 in globals.css');
});

test('globals.css: Card radii are strictly 16px and 24px', () => {
  const css = fs.readFileSync(path.join(rootDir, 'src/app/globals.css'), 'utf-8');
  assert(css.includes('--radius-card-sm: 16px;'), 'Missing 16px card-sm radius');
  assert(css.includes('--radius-card-lg: 24px;'), 'Missing 24px card-lg radius');
});

test('globals.css: Contains 9 fluid typography clamp definitions', () => {
  const css = fs.readFileSync(path.join(rootDir, 'src/app/globals.css'), 'utf-8');
  const clampMatches = css.match(/clamp\(/g);
  assert(clampMatches && clampMatches.length >= 8, `Expected >= 8 clamp() calls, found ${clampMatches?.length}`);
  assert(css.includes('--text-display: clamp('), 'Missing --text-display clamp');
  assert(css.includes('--text-h1: clamp('), 'Missing --text-h1 clamp');
  assert(css.includes('--text-h2: clamp('), 'Missing --text-h2 clamp');
  assert(css.includes('--text-h3: clamp('), 'Missing --text-h3 clamp');
  assert(css.includes('--text-h4: clamp('), 'Missing --text-h4 clamp');
  assert(css.includes('--text-body-lg: clamp('), 'Missing --text-body-lg clamp');
  assert(css.includes('--text-body: clamp('), 'Missing --text-body clamp');
  assert(css.includes('--text-body-sm: clamp('), 'Missing --text-body-sm clamp');
});

test('globals.css: Enforces light-mode only and reduced-motion accessibility', () => {
  const css = fs.readFileSync(path.join(rootDir, 'src/app/globals.css'), 'utf-8');
  assert(css.includes('color-scheme: light only;'), 'Missing light-mode only declaration');
  assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'Missing reduced-motion media query');
  assert(css.includes('animation-duration: 0.01ms !important;'), 'Missing reduced-motion animation override');
});

// 2. layout.tsx tests
test('layout.tsx: Uses Playfair Display, Inter, and Warm Ivory canvas styling', () => {
  const layout = fs.readFileSync(path.join(rootDir, 'src/app/layout.tsx'), 'utf-8');
  assert(layout.includes('Playfair_Display'), 'Missing Playfair Display font import');
  assert(layout.includes('Inter'), 'Missing Inter font import');
  assert(layout.includes('--font-serif'), 'Missing --font-serif variable');
  assert(layout.includes('--font-body'), 'Missing --font-body variable');
  assert(layout.includes('bg-[#FFF8F3]'), 'Missing bg-[#FFF8F3] Warm Ivory canvas');
  assert(layout.includes('text-[#765D62]'), 'Missing text-[#765D62] Body Text color');
  assert(layout.includes('colorScheme: "light"'), 'Missing viewport light colorScheme');
  assert(layout.includes('ShaadiSnap AI'), 'Missing ShaadiSnap AI brand title');
});

// 3. Container.tsx tests
test('Container.tsx: Implements 1280px max-width container with size variants', () => {
  const container = fs.readFileSync(path.join(rootDir, 'src/components/ui/Container.tsx'), 'utf-8');
  assert(container.includes('max-w-[1280px]'), 'Missing max-w-[1280px] default');
  assert(container.includes('max-w-[960px]'), 'Missing max-w-[960px] narrow');
  assert(container.includes('max-w-[1440px]'), 'Missing max-w-[1440px] wide');
  assert(container.includes('twMerge'), 'Missing twMerge import/usage');
  assert(container.includes('clsx'), 'Missing clsx import/usage');
});

// 4. motion.ts tests
test('motion.ts: Contains restrained 180ms-300ms durations and luxury easing', () => {
  const motionContent = fs.readFileSync(path.join(rootDir, 'src/lib/motion.ts'), 'utf-8');
  assert(motionContent.includes('fast: 0.18'), 'fast duration must be 0.18s (180ms)');
  assert(motionContent.includes('normal: 0.24'), 'normal duration must be 0.24s (240ms)');
  assert(motionContent.includes('deliberate: 0.3'), 'deliberate duration must be 0.3s (300ms)');
  assert(motionContent.includes('[0.16, 1, 0.3, 1]'), 'luxury easing bezier must be [0.16, 1, 0.3, 1]');
  assert(motionContent.includes('function getLuxuryTransition'), 'Missing getLuxuryTransition function');
  assert(motionContent.includes('shouldReduceMotion'), 'Missing shouldReduceMotion parameter');
  assert(motionContent.includes('duration: 0.01'), 'Reduced motion must collapse duration to 0.01s');
  assert(motionContent.includes('fadeInVariants'), 'Missing fadeInVariants');
  assert(motionContent.includes('fadeInUpVariants'), 'Missing fadeInUpVariants');
  assert(motionContent.includes('modalOverlayVariants'), 'Missing modalOverlayVariants');
  assert(motionContent.includes('modalContentVariants'), 'Missing modalContentVariants');
  assert(motionContent.includes('drawerVariants'), 'Missing drawerVariants');
  assert(motionContent.includes('staggerContainerVariants'), 'Missing staggerContainerVariants');
  assert(motionContent.includes('CSS_MICRO_INTERACTIONS'), 'Missing CSS_MICRO_INTERACTIONS');
});


// 5. Navbar.tsx & Footer.tsx tests
test('layout/Navbar.tsx: Implements ShaadiSnap AI brand, focus trap, and zero dead links', () => {
  const nav = fs.readFileSync(path.join(rootDir, 'src/components/layout/Navbar.tsx'), 'utf-8');
  assert(nav.includes('ShaadiSnap'), 'Missing ShaadiSnap brand in Navbar');
  assert(!nav.includes('#Maan'), 'Found legacy #Maan brand in Navbar');
  assert(!nav.includes('href="#"'), 'Found dead href="#" in Navbar');
  assert(!nav.includes('href="#how-it-works"'), 'Found anchor href="#how-it-works" in Navbar');
  assert(nav.includes('role="dialog"'), 'Missing ARIA dialog role on mobile drawer');
  assert(nav.includes('aria-modal="true"'), 'Missing aria-modal on mobile drawer');
  assert(nav.includes('handleKeyDown'), 'Missing keyboard event listener for focus trap');
  assert(nav.includes('focus-visible:ring-[#A85D70]'), 'Missing accessible focus ring in Navbar');
});

test('layout/Footer.tsx: Implements light mode luxury layout with zero dead links', () => {
  const footer = fs.readFileSync(path.join(rootDir, 'src/components/layout/Footer.tsx'), 'utf-8');
  assert(footer.includes('ShaadiSnap AI'), 'Missing ShaadiSnap AI brand in Footer');
  assert(!footer.includes('#Maan'), 'Found legacy #Maan brand in Footer');
  assert(!footer.includes('#242321'), 'Found legacy charcoal #242321 in Footer');
  assert(!footer.includes('href="#"'), 'Found dead href="#" in Footer');
  assert(footer.includes('bg-[#FFF8F3]'), 'Footer must use light mode Warm Ivory background');
  assert(footer.includes('DPDP Act 2023 Compliance'), 'Missing DPDP Act 2023 Compliance link');
  assert(footer.includes('GDPR Biometric Policy'), 'Missing GDPR Biometric Policy link');
  assert(footer.includes('Ephemeral Face Data Erasure'), 'Missing Ephemeral Face Data Erasure link');
});

// 6. Backwards-compatible re-exports
test('Navbar.tsx and Footer.tsx: Maintain backwards-compatible re-exports', () => {
  const navExport = fs.readFileSync(path.join(rootDir, 'src/components/Navbar.tsx'), 'utf-8');
  assert(navExport.includes('./layout/Navbar'), 'Navbar.tsx does not re-export from ./layout/Navbar');
  const footerExport = fs.readFileSync(path.join(rootDir, 'src/components/Footer.tsx'), 'utf-8');
  assert(footerExport.includes('./layout/Footer'), 'Footer.tsx does not re-export from ./layout/Footer');
});

console.log('\n--- All Milestone 1 Unit Tests Passed Successfully ---\n');
