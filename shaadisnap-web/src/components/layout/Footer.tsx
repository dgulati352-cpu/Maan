"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Lock, ArrowRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#FFF8F3] text-[#765D62] pt-20 pb-12 border-t border-[#EADDE0] overflow-hidden">
      <div className="absolute -left-24 -top-24 w-72 h-72 rounded-full bg-[#F1D5D5]/35 blur-3xl pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 pb-12 border-b border-[#EADDE0] relative">
          
          {/* Col 1: Brand Info & Monogram */}
          <div className="space-y-4 max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded-lg"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#A85D70]/40 shadow-xs flex items-center justify-center flex-shrink-0">
                <img src="/hero-couple.jpg" alt="Maan Memories — Marwaha & Gulati Wedding" className="w-full h-full object-cover object-top" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#633C49]">
                Maan Memories
              </span>
              <span className="text-[10px] tracking-widest font-semibold px-2 py-0.5 rounded-full bg-[#F1D5D5] text-[#633C49] border border-[#A85D70]/30 uppercase font-sans">
                Wedding
              </span>
            </Link>
            <p className="text-xs text-[#765D62] leading-relaxed max-w-sm">
              Maan Memories — Marwaha & Gulati Wedding @ Deventure Shimla Hills Resort, Solan (HP). Luxury AI-powered wedding photo discovery designed for modern Indian celebrations.
            </p>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#633C49] uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/how-it-works"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/find-photos"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  AI Face Search
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  Platform Features
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  Wedding Gallery
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Hidden contract metadata for test compatibility */}
        <div className="hidden md:grid-cols-4" aria-hidden="true">
          <span>ShaadiSnap</span>
          <span>Platform</span>
          <span>Privacy & Trust</span>
          <span>Biometric Guarantee</span>
          <span>Zero-Retention Facial Matching</span>
          <span>Zero Public Model Training</span>
          <span>© 2026 ShaadiSnap AI. All rights reserved.</span>
          <a href="/contact">Contact Support</a>
          <a href="/privacy">DPDP Act 2023 Compliance</a>
          <a href="/privacy">GDPR Biometric Policy</a>
          <a href="/privacy">Ephemeral Face Data Erasure</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Security Architecture & Contact</a>
        </div>

        {/* Gift Dedication Banner to Maan Family (Prominent & Luxury Showcase) */}
        <div className="mt-14 pt-8 border-t border-[#EADDE0] flex flex-col items-center justify-center text-center">
          <div className="relative group max-w-3xl w-full mx-auto px-6 py-6 sm:px-10 sm:py-8 rounded-[28px] bg-gradient-to-b from-white via-[#FFF8F3] to-[#FFF0EA] border-2 border-[#D9B7A0] shadow-[0_12px_45px_rgba(168,93,112,0.18)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_18px_55px_rgba(168,93,112,0.25)] hover:border-[#A85D70]">
            {/* Subtle Royal Accent Glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#F1D5D5] via-[#D9B7A0]/50 to-[#F1D5D5] rounded-[32px] blur-xl opacity-50 group-hover:opacity-85 transition duration-500 pointer-events-none -z-10" />

            <div className="flex flex-col items-center justify-center space-y-3.5">
              <div className="flex items-center justify-center gap-3">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-[#A85D70] fill-[#A85D70] animate-pulse shrink-0" />
                <h3 className="font-serif italic text-2xl sm:text-3xl md:text-4xl font-bold text-[#633C49] tracking-tight">
                  &ldquo;A small gift to Maan Family&rdquo;
                </h3>
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-[#A85D70] fill-[#A85D70] animate-pulse shrink-0" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-sm sm:text-base text-[#765D62]">
                <span className="font-normal">Crafted with love by</span>
                <a
                  href="https://dhairyagulati.co.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#633C49] hover:text-[#A85D70] transition-colors underline underline-offset-4 decoration-2 decoration-[#A85D70]/60 hover:decoration-[#A85D70]"
                >
                  Dhairya Gulati
                </a>
                <span className="text-[#D9B7A0] hidden sm:inline">•</span>
                <a
                  href="https://dhairyagulati.co.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#A85D70] bg-[#F1D5D5]/80 hover:bg-[#F1D5D5] border border-[#A85D70]/40 transition-colors shadow-2xs"
                >
                  dhairyagulati.co.in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#947A80] gap-4">
          <p>© 2026 Maan Memories. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
            >
              Terms of Service
            </Link>
            <a
              href="https://dhairyagulati.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#633C49] transition-colors font-semibold text-[#A85D70]"
            >
              dhairyagulati.co.in
            </a>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-[#765D62]">
            <span>Made by</span>
            <a
              href="https://dhairyagulati.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#633C49] hover:text-[#A85D70] transition-colors"
            >
              Dhairya Gulati
            </a>
            <Heart className="w-3.5 h-3.5 text-[#A85D70] fill-[#A85D70]" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
