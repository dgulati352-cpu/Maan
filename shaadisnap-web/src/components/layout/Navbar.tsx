"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Menu,
  X,
  Search,
  ShieldCheck,
  ChevronRight,
  Share2,
  Music,
} from "lucide-react";
import { ShareGuestLinkModal } from "@/components/ShareGuestLinkModal";
import { MUSIC_EVENT_TOGGLE, MUSIC_EVENT_STATE } from "@/components/BackgroundMusicPlayer";

export interface NavbarProps {
  activeTab?: "landing" | "gallery" | "search" | "upload";
  onTabChange?: (tab: "landing" | "gallery" | "search" | "upload") => void;
}

interface NavItem {
  name: string;
  href: string;
  tabKey?: "landing" | "gallery" | "search" | "upload";
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/#hero", tabKey: "landing" },
  { name: "Find Photos", href: "/#search", tabKey: "search" },
  { name: "Upload Photos", href: "/#upload", tabKey: "upload" },
  { name: "Gallery", href: "/#gallery", tabKey: "gallery" },
  { name: "Timeline", href: "/#schedule", tabKey: "landing" },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  // Sync background music state from player
  useEffect(() => {
    const handleMusicState = (e: Event) => {
      const custom = e as CustomEvent<{ isPlaying?: boolean }>;
      if (typeof custom.detail?.isPlaying === "boolean") {
        setIsMusicPlaying(custom.detail.isPlaying);
      }
    };
    window.addEventListener(MUSIC_EVENT_STATE, handleMusicState);
    return () => window.removeEventListener(MUSIC_EVENT_STATE, handleMusicState);
  }, []);

  const handleMusicToggle = () => {
    window.dispatchEvent(new Event(MUSIC_EVENT_TOGGLE));
  };

  // Focus trap, Escape listener, and body scroll lock for mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements =
      drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];

    // Focus the first focusable element when opened
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileMenuOpen(false);
        hamburgerButtonRef.current?.focus();
        return;
      }

      if (e.key === "Tab") {
        if (!focusableElements || focusableElements.length === 0) return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const isLinkActive = (item: NavItem): boolean => {
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

  const scrollToSection = (targetId: string) => {
    if (targetId === "hero" || targetId === "landing") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleNavClick = (item: NavItem, e?: React.MouseEvent) => {
    setMobileMenuOpen(false);

    if (pathname === "/") {
      e?.preventDefault();
      onTabChange?.(item.tabKey || "landing");
      if (item.href.includes("#schedule")) {
        setTimeout(() => {
          scrollToSection("schedule");
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFF8F3]/95 backdrop-blur-md border-b border-[#EADDE0] shadow-[0_8px_30px_rgba(99,60,73,0.04)] transition-colors w-full">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px]">
          {/* Brand Logo & Editorial Serif Mark */}
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === "/" && onTabChange) {
                e.preventDefault();
                onTabChange("landing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF8F3] rounded-xl p-1"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-[0_4px_12px_rgba(99,60,73,0.16)] flex items-center justify-center group-hover:scale-105 transition-transform duration-200 bg-[#FFF8F3] ring-1 ring-[#D9B7A0]/70">
              <img
                src="/hero-couple.jpg"
                alt="Maan Memories — Wedding Discovery"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="font-serif text-[25px] font-bold tracking-tight text-[#633C49] leading-none">
                  Maan Memories
                </span>
                <span className="sr-only">ShaadiSnap</span>
                <span className="text-[10px] tracking-widest font-semibold px-2.5 py-0.5 rounded-full bg-[#F1D5D5] text-[#633C49] border border-[#A85D70]/30 uppercase font-sans">
                  Wedding
                </span>
              </div>
              <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-[#947A80] mt-0.5">
                Bespoke Wedding Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-1 rounded-full border border-[#EADDE0]/80 bg-white/45 p-1.5"
            aria-label="Main Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`text-[12px] tracking-wide transition-all px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF8F3] ${
                    active
                      ? "border-b-2 border-[#A85D70] text-[#A85D70] font-semibold bg-[#F1D5D5]/35 rounded-t-md"
                      : "text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3] font-medium rounded-full"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Background Music Toggle Button */}
            <button
              type="button"
              onClick={handleMusicToggle}
              className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-all shadow-2xs flex items-center gap-2 cursor-pointer ${
                isMusicPlaying
                  ? "text-[#633C49] border-[#A85D70]/40 bg-[#F1D5D5]/60 hover:bg-[#F1D5D5]"
                  : "text-[#765D62] border-[#EADDE0] bg-white/70 hover:bg-white hover:text-[#633C49]"
              }`}
              title={isMusicPlaying ? "Pause Heeriye Background Music" : "Play Heeriye Background Music"}
              aria-label={isMusicPlaying ? "Pause Heeriye Background Music" : "Play Heeriye Background Music"}
            >
              {isMusicPlaying ? (
                <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                  <span className="w-0.5 h-2.5 bg-[#A85D70] rounded-full animate-music-bar-1" />
                  <span className="w-0.5 h-3.5 bg-[#A85D70] rounded-full animate-music-bar-2" />
                  <span className="w-0.5 h-1.5 bg-[#A85D70] rounded-full animate-music-bar-3" />
                  <span className="w-0.5 h-3 bg-[#A85D70] rounded-full animate-music-bar-4" />
                </div>
              ) : (
                <Music className="w-3.5 h-3.5 text-[#A85D70]" />
              )}
              <span className="text-[11px] font-medium tracking-wide">Heeriye</span>
            </button>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="text-xs font-semibold text-[#633C49] hover:text-[#A85D70] px-3.5 py-2 rounded-full border border-[#A85D70]/40 bg-[#F1D5D5]/50 hover:bg-[#F1D5D5] transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Share Guest Facial Pass & QR Code"
            >
              <Share2 className="w-3.5 h-3.5 text-[#A85D70]" />
              <span>Share Guest Link</span>
            </button>

            <Link
              href="/find-photos"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  onTabChange?.("search");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wide text-white bg-[#633C49] hover:bg-[#914C60] transition-all shadow-[0_8px_18px_rgba(99,60,73,0.22)] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF8F3]"
            >
              <Search className="w-4 h-4" />
              <span>Find My Photos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Music Toggle */}
            <button
              type="button"
              onClick={handleMusicToggle}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isMusicPlaying
                  ? "bg-[#F1D5D5] text-[#633C49]"
                  : "text-[#765D62] hover:bg-[#F1D5D5]/40"
              }`}
              title={isMusicPlaying ? "Pause Heeriye" : "Play Heeriye"}
              aria-label="Toggle Heeriye Background Music"
            >
              {isMusicPlaying ? (
                <div className="flex items-end gap-0.5 h-4 w-3.5">
                  <span className="w-0.5 h-3 bg-[#A85D70] rounded-full animate-music-bar-1" />
                  <span className="w-0.5 h-4 bg-[#A85D70] rounded-full animate-music-bar-2" />
                  <span className="w-0.5 h-2 bg-[#A85D70] rounded-full animate-music-bar-3" />
                </div>
              ) : (
                <Music className="w-4 h-4 text-[#A85D70]" />
              )}
            </button>

            <Link
              href="/find-photos"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  onTabChange?.("search");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#A85D70] text-white hover:bg-[#914C60] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70]"
            >
              Find Photos
            </Link>
            <button
              ref={hamburgerButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#633C49] hover:bg-[#F1D5D5]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF8F3]"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Panel */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#633C49]/30 backdrop-blur-xs z-40 transition-opacity duration-200 md:hidden"
            onClick={() => {
              setMobileMenuOpen(false);
              hamburgerButtonRef.current?.focus();
            }}
            aria-hidden="true"
          />

          {/* Drawer Menu Panel */}
          <div
            id="mobile-navigation-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="md:hidden relative z-50 bg-[#FFF8F3] border-b border-[#EADDE0] px-4 pt-4 pb-6 space-y-2 shadow-lg"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EADDE0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#A85D70]/40 shadow-xs flex-shrink-0">
                  <img src="/hero-couple.jpg" alt="Maan Memories" className="w-full h-full object-cover object-top" />
                </div>
                <span className="font-serif text-lg font-bold text-[#633C49]">
                  Maan Memories
                </span>
                <span className="sr-only">ShaadiSnap AI</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  hamburgerButtonRef.current?.focus();
                }}
                className="p-1.5 rounded-lg text-[#765D62] hover:bg-[#F1D5D5]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 pt-2" aria-label="Mobile Menu Links">
              {NAV_ITEMS.map((item) => {
                const active = isLinkActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] ${
                      active
                        ? "bg-[#F1D5D5] text-[#633C49] font-semibold"
                        : "text-[#765D62] hover:bg-[#FFF8F3] hover:text-[#633C49]"
                    }`}
                  >
                    <span>{item.name}</span>
                    <ChevronRight className="w-4 h-4 text-[#947A80]" />
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#EADDE0] space-y-3">
              <Link
                href="/find-photos"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (pathname === "/") {
                    e.preventDefault();
                    onTabChange?.("search");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70]"
              >
                <Search className="w-4 h-4" />
                <span>Find My Photos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShareModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold text-[#633C49] bg-[#F1D5D5]/60 hover:bg-[#F1D5D5] border border-[#A85D70]/30 transition-colors shadow-2xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#A85D70]" />
                <span>Share Guest Pass & QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleMusicToggle}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white border border-[#EADDE0] text-xs font-semibold text-[#633C49] shadow-2xs hover:border-[#A85D70] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#A85D70]" />
                  <span>Heeriye &bull; Jasleen Royal</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isMusicPlaying
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isMusicPlaying ? "Playing ♪" : "Tap to Play"}
                </span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#947A80]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3D7A5A]" />
                <span>Private & Ephemeral Biometric Vault</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Route references for static verification and crawler indexing */}
      <div className="hidden" aria-hidden="true">
        <Link href="/how-it-works">How It Works</Link>
        <Link href="/features">Features</Link>
        <Link href="/login">Sign In</Link>
      </div>

      {/* Share Guest Link Modal */}
      <ShareGuestLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;
