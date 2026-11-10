"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, Lock, ArrowRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#FFF8F3] text-[#765D62] pt-20 pb-12 border-t border-[#EADDE0] overflow-hidden">
      <div className="absolute -left-24 -top-24 w-72 h-72 rounded-full bg-[#F1D5D5]/35 blur-3xl pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#EADDE0] relative">
          
          {/* Col 1: Brand Info & Monogram */}
          <div className="space-y-4 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded-lg"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#A85D70]/40 shadow-xs flex items-center justify-center flex-shrink-0">
                <img src="/hero-couple.jpg" alt="Dhairya AI — Marwaha & Gulati Wedding" className="w-full h-full object-cover object-top" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#633C49]">
                Dhairya AI
              </span>
              <span className="text-[10px] tracking-widest font-semibold px-2 py-0.5 rounded-full bg-[#F1D5D5] text-[#633C49] border border-[#A85D70]/30 uppercase font-sans">
                Wedding
              </span>
            </Link>
            <p className="text-xs text-[#765D62] leading-relaxed max-w-xs">
              Dhairya AI — Marwaha & Gulati Wedding @ Deventure Shimla Hills Resort, Solan (HP). Luxury AI-powered wedding photo discovery designed for modern Indian celebrations. Completely private, ephemeral, and DPDP Act 2023 compliant.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F1D5D5] text-[#633C49] border border-[#A85D70]/20">
                <Lock className="w-3 h-3 text-[#A85D70]" />
                Zero-Retention Facial Matching
              </span>
            </div>
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
                  href="/login"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  Organizer & Studio Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  Create Organizer Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Privacy & Security */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#633C49] uppercase tracking-wider">
              Privacy & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/privacy"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  DPDP Act 2023 Compliance
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  GDPR Biometric Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  Ephemeral Face Data Erasure
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[#765D62] hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  Security Architecture & Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Biometric Guarantee Badge */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#633C49] uppercase tracking-wider">
              Biometric Guarantee
            </h4>
            <div className="bg-white/75 p-4 rounded-2xl border border-white shadow-[0_12px_30px_rgba(99,60,73,0.08)] space-y-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs text-[#A85D70] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#3D7A5A]" />
                <span>Zero Public Model Training</span>
              </div>
              <p className="text-[11px] text-[#765D62] leading-relaxed">
                Guest selfies are processed ephemerally solely to discover your photographs. Biometric embeddings are never retained in public AI datasets and can be purged on demand.
              </p>
              <div className="pt-1">
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A85D70] hover:text-[#914C60] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
                >
                  <span>Read Privacy Charter</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#947A80] gap-4">
          <p>© 2026 Dhairya AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
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
            <Link
              href="/contact"
              className="hover:text-[#633C49] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] rounded"
            >
              Contact Support
            </Link>
          </div>
          <p className="flex items-center gap-1">
            Crafted with <Heart className="w-3.5 h-3.5 text-[#A85D70] fill-[#A85D70]" /> for luxury Indian weddings.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
