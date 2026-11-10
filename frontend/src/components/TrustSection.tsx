"use client";

import React from "react";
import { ShieldCheck, Lock, Award, FileCheck2, Sparkles } from "lucide-react";

export const TrustSection: React.FC = () => {
  const pillars = [
    {
      icon: Lock,
      title: "256-Bit Ephemeral Biometric Vault",
      subtitle: "Zero-Retention Architecture",
      description:
        "Guest selfies are transformed into temporary 512-dimensional ArcFace vector embeddings in encrypted memory and purged immediately after photo matching. No facial images or vector data are ever persisted or retained.",
      highlight: "Bank-Grade Encryption",
    },
    {
      icon: ShieldCheck,
      title: "DPDP Act 2023 & GDPR Compliance",
      subtitle: "Sovereign Biometric Charter",
      description:
        "Strictly compliant with India's Digital Personal Data Protection Act 2023 and European GDPR standards. Biometric processing requires explicit opt-in consent with instantaneous 1-click on-demand data erasure.",
      highlight: "Non-Bypassable Consent",
    },
    {
      icon: Award,
      title: "RAW Master Preservation",
      subtitle: "Studio High-Resolution Quality",
      description:
        "Every candid and ceremonial photograph from Deventure Shimla Hills Resort, Solan (HP) is archived in full uncompressed resolution. Download print-ready high-definition masters without compression artifacts or watermarks.",
      highlight: "Lossless Master Files",
    },
    {
      icon: FileCheck2,
      title: "Private Royal Wedding Partition",
      subtitle: "Strict Guest-Only Boundary",
      description:
        "Dedicated isolated event container for Mahine & Anand's royal celebration. Biometric vectors never leak into public models, commercial training corpora, or external search engines.",
      highlight: "Isolated Event Vault",
    },
  ];

  return (
    <section className="relative py-16 lg:py-24 bg-[#FFF8F3] overflow-hidden border-t border-[#EADDE0]">
      {/* Royal Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#A85D70]/10 via-[#F1D5D5]/25 to-[#D9B7A0]/15 blur-3xl pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#D9B7A0]/60 text-[#633C49] text-[10px] font-bold tracking-[0.18em] uppercase shadow-[0_6px_20px_rgba(99,60,73,0.06)] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#A85D70]" />
            <span>Regal Palace Privacy & Security</span>
          </div>

          <h2 className="font-serif text-fluid-h2 font-bold text-[#633C49] tracking-tight">
            Trust &amp; Biometric Integrity
          </h2>

          <p className="text-sm sm:text-base text-[#765D62] max-w-2xl mx-auto leading-relaxed">
            Your privacy is as sacrosanct as the royal celebration. Designed for the high-profile wedding of Mahine &amp; Anand at Deventure Shimla Hills Resort, Solan (HP) with uncompromising security standards.
          </p>
        </div>

        {/* 4 Pillars Grid with Architectural Borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white/85 backdrop-blur-md rounded-[24px] p-6 sm:p-7 border border-[#EADDE0] hover:border-[#D9B7A0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] hover:shadow-[0_18px_40px_rgba(99,60,73,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Architectural Gold Corner Reticles */}
                <span className="absolute top-3 left-3 w-3.5 h-3.5 border-t border-l border-[#D9B7A0]/50 pointer-events-none group-hover:border-[#A85D70] transition-colors" />
                <span className="absolute top-3 right-3 w-3.5 h-3.5 border-t border-r border-[#D9B7A0]/50 pointer-events-none group-hover:border-[#A85D70] transition-colors" />
                <span className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b border-l border-[#D9B7A0]/50 pointer-events-none group-hover:border-[#A85D70] transition-colors" />
                <span className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b border-r border-[#D9B7A0]/50 pointer-events-none group-hover:border-[#A85D70] transition-colors" />

                <div className="space-y-4">
                  {/* Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F1D5D5] to-[#FFF8F3] border border-[#D9B7A0]/60 flex items-center justify-center text-[#633C49] shadow-xs group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-[#A85D70]" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#A85D70] bg-[#F1D5D5]/50 px-2.5 py-1 rounded-full border border-[#A85D70]/20">
                      {pillar.highlight}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#947A80] font-semibold block">
                      {pillar.subtitle}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#633C49] mt-0.5 leading-snug">
                      {pillar.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#765D62] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                {/* Bottom Verification Accent */}
                <div className="mt-6 pt-4 border-t border-[#EADDE0]/70 flex items-center gap-1.5 text-[11px] text-[#477A5B] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#477A5B]" />
                  <span>Audited &amp; Verified Architecture</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Ephemeral Certification Plaque */}
        <div className="mt-12 p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D9B7A0]/50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#633C49] flex items-center justify-center text-white shrink-0">
              <Lock className="w-4 h-4 text-[#D9B7A0]" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-[#633C49]">
                ShaadiSnap Biometric Privacy Guarantee
              </p>
              <p className="text-xs text-[#765D62]">
                Permanent erasure logs available in real-time under India DPDP Act 2023 &amp; EU GDPR Article 17.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-[#A85D70] bg-[#F1D5D5]/50 px-4 py-2 rounded-full border border-[#A85D70]/30 shrink-0">
            Event Hash: DEVENTURE-SOLAN-2026-MG
          </div>
        </div>

      </div>
    </section>
  );
};

export default TrustSection;
