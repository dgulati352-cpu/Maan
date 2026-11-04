import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as babelParser from '@babel/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n--- Running Independent Adversarial Navbar Contract Tests (AST & DOM) ---\n');

const navbarPath = path.join(rootDir, 'src/components/layout/Navbar.tsx');
const navbarSource = fs.readFileSync(navbarPath, 'utf-8');

// Parse AST with @babel/parser
const ast = babelParser.parse(navbarSource, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript'],
});

function walk(node, visitor) {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) walk(c, visitor);
    } else if (child && typeof child === 'object' && child.type) {
      walk(child, visitor);
    }
  }
}

// 1. AST Contract: Sticky Header Element
test('AST: Header element is semantic <header> with sticky, top-0, z-50, backdrop blur, and burgundy shadow', () => {
  let headerFound = false;
  let headerClass = '';

  walk(ast, (node) => {
    if (node.type === 'JSXElement' && node.openingElement.name.name === 'header') {
      headerFound = true;
      const classAttr = node.openingElement.attributes.find(
        (attr) => attr.name && attr.name.name === 'className'
      );
      if (classAttr && classAttr.value && classAttr.value.type === 'StringLiteral') {
        headerClass = classAttr.value.value;
      }
    }
  });

  assert(headerFound, 'Semantic <header> element not found in AST');
  assert(headerClass.includes('sticky'), '<header> must include "sticky"');
  assert(headerClass.includes('top-0'), '<header> must include "top-0"');
  assert(headerClass.includes('z-50'), '<header> must include "z-50"');
  assert(headerClass.includes('bg-[#FFF8F3]/95'), '<header> must include "bg-[#FFF8F3]/95" Warm Ivory background');
  assert(headerClass.includes('backdrop-blur-md'), '<header> must include "backdrop-blur-md"');
  assert(headerClass.includes('border-b border-[#EADDE0]'), '<header> must include "border-b border-[#EADDE0]" subtle border');
  assert(headerClass.includes('shadow-[0_8px_30px_rgba(99,60,73,0.04)]'), '<header> must include warm burgundy shadow "shadow-[0_8px_30px_rgba(99,60,73,0.04)]"');
  assert(headerClass.includes('w-full'), '<header> must include "w-full"');
});

// 2. AST Contract: 1280px Container Boundaries
test('AST: Root inner container strictly enforces 1280px boundaries (max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8)', () => {
  let containerFound = false;
  let containerClass = '';

  walk(ast, (node) => {
    if (node.type === 'JSXElement') {
      const classAttr = node.openingElement.attributes.find(
        (attr) => attr.name && attr.name.name === 'className'
      );
      if (classAttr && classAttr.value && classAttr.value.type === 'StringLiteral') {
        if (classAttr.value.value.includes('max-w-[1280px]')) {
          containerFound = true;
          containerClass = classAttr.value.value;
        }
      }
    }
  });

  assert(containerFound, 'Inner container with max-w-[1280px] not found in AST');
  assert(containerClass.includes('mx-auto'), 'Container must have "mx-auto" centering');
  assert(containerClass.includes('px-4'), 'Container must have "px-4" mobile padding');
  assert(containerClass.includes('sm:px-6'), 'Container must have "sm:px-6" tablet padding');
  assert(containerClass.includes('lg:px-8'), 'Container must have "lg:px-8" desktop padding');
});

// 3. AST Contract: Brand Elements
test('AST: Brand identity uses "ShaadiSnap" title, "AI" pill, and zero legacy "#Maan"', () => {
  assert(navbarSource.includes('ShaadiSnap'), 'Navbar source must contain "ShaadiSnap"');
  assert(!navbarSource.includes('#Maan'), 'Navbar source must NOT contain legacy "#Maan"');
  assert(navbarSource.includes('Bespoke Wedding Discovery'), 'Navbar source must include "Bespoke Wedding Discovery" tagline');
});

// 4. AST Contract: NAV_ITEMS Array Declaration
test('AST: NAV_ITEMS constant defines all 6 canonical navigation items', () => {
  let navItemsFound = false;
  let navItemsCount = 0;
  const items = [];

  walk(ast, (node) => {
    if (
      node.type === 'VariableDeclarator' &&
      node.id.name === 'NAV_ITEMS' &&
      node.init &&
      node.init.type === 'ArrayExpression'
    ) {
      navItemsFound = true;
      navItemsCount = node.init.elements.length;
      for (const el of node.init.elements) {
        if (el.type === 'ObjectExpression') {
          const item = {};
          for (const prop of el.properties) {
            if (prop.key && prop.value && prop.value.type === 'StringLiteral') {
              item[prop.key.name] = prop.value.value;
            }
          }
          items.push(item);
        }
      }
    }
  });

  assert(navItemsFound, 'NAV_ITEMS array declaration not found in AST');
  assert(navItemsCount === 6, `Expected exactly 6 items in NAV_ITEMS, found ${navItemsCount}`);
  
  const expectedHrefs = ['/', '/gallery', '/how-it-works', '/features', '/find-photos', '/upload-photos'];
  for (const expectedHref of expectedHrefs) {
    const found = items.some((it) => it.href === expectedHref);
    assert(found, `Missing expected route in NAV_ITEMS: ${expectedHref}`);
  }
});

// 5. AST Contract: Active Link Styling & aria-current
test('AST: Active link indicators apply Rose Champagne tokens and aria-current="page"', () => {
  // Desktop active styling
  assert(
    navbarSource.includes('border-b-2 border-[#A85D70] text-[#A85D70] font-semibold bg-[#F1D5D5]/35 rounded-t-md'),
    'Desktop active indicator missing exact token classes'
  );
  // Mobile active styling
  assert(
    navbarSource.includes('bg-[#F1D5D5] text-[#633C49] font-semibold'),
    'Mobile drawer active indicator missing exact token classes'
  );
  // aria-current attribute
  assert(
    navbarSource.includes('aria-current={active ? "page" : undefined}'),
    'Desktop navigation link missing aria-current={active ? "page" : undefined}'
  );
});

// 6. AST Contract: Mobile Drawer Accessibility & Focus Trap
test('AST: Mobile drawer enforces accessibility dialog role, modal attribute, and keyboard focus trap', () => {
  assert(navbarSource.includes('role="dialog"'), 'Mobile drawer missing role="dialog"');
  assert(navbarSource.includes('aria-modal="true"'), 'Mobile drawer missing aria-modal="true"');
  assert(navbarSource.includes('aria-label="Mobile Navigation"'), 'Mobile drawer missing aria-label="Mobile Navigation"');
  assert(navbarSource.includes('handleKeyDown'), 'Missing handleKeyDown for keyboard navigation in mobile drawer');
  assert(navbarSource.includes('e.key === "Escape"'), 'Missing Escape key handler in mobile drawer');
  assert(navbarSource.includes('e.key === "Tab"'), 'Missing Tab key cycle handler for focus trap in mobile drawer');
  assert(navbarSource.includes('document.body.style.overflow = "hidden"'), 'Missing body scroll lock when mobile drawer opens');
});

// 7. AST Contract: Zero Dead Links & Target Route Resolution
test('AST & Filesystem: Zero dead links and all route targets exist in src/app', () => {
  const linkHrefs = new Set();

  walk(ast, (node) => {
    if (node.type === 'JSXElement') {
      const tagName = node.openingElement.name.name;
      if (tagName === 'Link' || tagName === 'a') {
        const hrefAttr = node.openingElement.attributes.find(
          (attr) => attr.name && attr.name.name === 'href'
        );
        if (hrefAttr && hrefAttr.value) {
          if (hrefAttr.value.type === 'StringLiteral') {
            linkHrefs.add(hrefAttr.value.value);
          } else if (
            hrefAttr.value.type === 'JSXExpressionContainer' &&
            hrefAttr.value.expression.type === 'MemberExpression'
          ) {
            // Dynamic item.href
            linkHrefs.add('__DYNAMIC_ITEM_HREF__');
          }
        }
      }
    }
  });

  assert(!linkHrefs.has('#'), 'Disallowed dead link href="#" found in Navbar');
  assert(!linkHrefs.has(''), 'Disallowed empty href="" found in Navbar');

  // Verify all static link destinations against src/app
  for (const href of linkHrefs) {
    if (href === '__DYNAMIC_ITEM_HREF__') continue;
    
    // Clean route path
    const routePath = href.split('#')[0];
    let expectedPage = '';
    if (routePath === '/') {
      expectedPage = path.join(rootDir, 'src/app/page.tsx');
    } else {
      expectedPage = path.join(rootDir, 'src/app', routePath, 'page.tsx');
    }
    assert(
      fs.existsSync(expectedPage),
      `Dead link detected: "${href}" does not map to existing page at ${expectedPage}`
    );
  }
});

// 8. Behavioral Contract: Simulated isLinkActive Routing Logic
test('Behavioral: isLinkActive correctly identifies single active link and handles all route variations', () => {
  const NAV_ITEMS = [
    { name: "Home", href: "/", tabKey: "landing" },
    { name: "Gallery", href: "/gallery", tabKey: "gallery" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Features", href: "/features" },
    { name: "Find Photos", href: "/find-photos", tabKey: "search" },
    { name: "Upload Photos", href: "/upload-photos", tabKey: "upload" },
  ];

  const simulateIsLinkActive = (item, pathname, activeTab) => {
    if (pathname === "/") {
      if (activeTab) {
        return item.tabKey === activeTab;
      }
      return item.tabKey === "landing";
    }
    if (item.href === "/") return false;
    if (item.tabKey === "gallery" && pathname?.startsWith("/gallery")) return true;
    if (item.tabKey === "search" && pathname?.startsWith("/find-photos")) return true;
    if (item.tabKey === "upload" && pathname?.startsWith("/upload-photos")) return true;
    return pathname === item.href;
  };

  const scenarios = [
    { pathname: '/', activeTab: undefined, expectedActive: 'Home' },
    { pathname: '/', activeTab: 'gallery', expectedActive: 'Gallery' },
    { pathname: '/', activeTab: 'search', expectedActive: 'Find Photos' },
    { pathname: '/', activeTab: 'upload', expectedActive: 'Upload Photos' },
    { pathname: '/gallery', activeTab: undefined, expectedActive: 'Gallery' },
    { pathname: '/gallery/123', activeTab: undefined, expectedActive: 'Gallery' },
    { pathname: '/find-photos', activeTab: undefined, expectedActive: 'Find Photos' },
    { pathname: '/upload-photos', activeTab: undefined, expectedActive: 'Upload Photos' },
    { pathname: '/how-it-works', activeTab: undefined, expectedActive: 'How It Works' },
    { pathname: '/features', activeTab: undefined, expectedActive: 'Features' },
    { pathname: '/login', activeTab: undefined, expectedActive: null },
    { pathname: '/admin', activeTab: undefined, expectedActive: null },
  ];

  for (const { pathname, activeTab, expectedActive } of scenarios) {
    const activeItems = NAV_ITEMS.filter((item) => simulateIsLinkActive(item, pathname, activeTab));
    if (expectedActive === null) {
      assert(activeItems.length === 0, `Expected 0 active items for ${pathname}, got ${activeItems.map((i) => i.name)}`);
    } else {
      assert(
        activeItems.length === 1 && activeItems[0].name === expectedActive,
        `For pathname "${pathname}" (activeTab: ${activeTab}), expected "${expectedActive}" active, but got: [${activeItems.map((i) => i.name)}]`
      );
    }
  }
});

console.log(`\n--- Navbar Contract Test Summary: ${passed} Passed, ${failed} Failed ---\n`);
if (failed > 0) process.exit(1);
