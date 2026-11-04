"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Lock, Trash2, FileText, ArrowRight } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar />

      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1D5D5]/60 border border-[#EADDE0] text-xs font-semibold tracking-widest uppercase text-[#633C49]">
              <ShieldCheck className="w-4 h-4 text-[#A85D70]" />
              <span>DPDP Act 2023 & GDPR Compliance</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#633C49]">
              Privacy Charter & Biometric Policy
            </h1>
            <p className="text-base sm:text-lg text-[#765D62] max-w-2xl mx-auto leading-relaxed">
              At ShaadiSnap AI, we believe luxury celebrations require the highest standards of digital privacy. Learn how your facial biometric data and wedding memories are guarded.
            </p>
          </div>

          {/* Key Commitments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-2xl p-7 border border-[#EADDE0] shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70]">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#633C49]">
                Zero-Retention Ephemeral Matching
              </h2>
              <p className="text-xs sm:text-sm text-[#765D62] leading-relaxed">
                Guest selfies are converted to transient mathematical embeddings solely for real-time comparison. Selfies are never saved to permanent storage or used to train general AI models.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-[#EADDE0] shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70]">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#633C49]">
                India DPDP Act 2023
              </h2>
              <p className="text-xs sm:text-sm text-[#765D62] leading-relaxed">
                We operate under strict purpose limitation, data minimization, and affirmative biometric consent under the Digital Personal Data Protection Act 2023 of India.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-[#EADDE0] shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70]">
                <Trash2 className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#633C49]">
                Right to Immediate Erasure
              </h2>
              <p className="text-xs sm:text-sm text-[#765D62] leading-relaxed">
                Every wedding guest retains complete authority over their likeness. You can request deletion of any photograph or facial vector record at any time with one click.
              </p>
            </div>
          </div>

          {/* Detailed Policy Content */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EADDE0] shadow-xs space-y-10 max-w-4xl mx-auto">
            
            <section className="space-y-4">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>1. Facial Biometric Analysis & GDPR Article 9</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                Biometric data is categorized as a special category of personal data under GDPR Article 9 and sensitive personal data under India&apos;s DPDP Act 2023. ShaadiSnap AI processes facial features exclusively to assist wedding guests in locating their candid photographs across private event albums.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[#765D62] pl-4 list-disc">
                <li>We extract high-dimensional facial vector embeddings (ArcFace IResNet-50) in memory.</li>
                <li>Your reference selfie is discarded immediately after cosine distance search completion.</li>
                <li>No face profiles are shared with advertising networks, third-party brokers, or government databases.</li>
              </ul>
            </section>

            <section className="space-y-4 border-t border-[#EADDE0] pt-8">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>2. Event Scope & Access Isolation</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                Every wedding album is isolated in a private event vault protected by cryptographic token identifiers. Guests attending the Oberoi Udaivilas celebration can only search photographs uploaded for that specific celebration. Cross-wedding indexing is strictly forbidden by architectural system constraints.
              </p>
            </section>

            <section className="space-y-4 border-t border-[#EADDE0] pt-8">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>3. Uncompressed HD Storage & Integrity</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                Wedding moments uploaded by studio photographers and guests are preserved in uncompressed high-definition resolution without lossy re-encoding. Master files are secured using AES-256 server-side encryption and delivered over TLS 1.3 encrypted connections.
              </p>
            </section>

            <section className="space-y-4 border-t border-[#EADDE0] pt-8">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>4. Exercising Your Rights</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                Under the DPDP Act 2023 and GDPR, you possess the right to access, rectify, or permanently purge any photo featuring your likeness. To request an expedited manual review or immediate purge, please reach out to our dedicated Data Protection Officer:
              </p>
              <div className="bg-[#FFF8F3] p-5 rounded-xl border border-[#EADDE0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#A85D70] block">
                    Data Protection Concierge
                  </span>
                  <span className="font-serif text-lg font-bold text-[#633C49]">
                    privacy@shaadisnap.ai
                  </span>
                  <p className="text-xs text-[#947A80] mt-0.5">
                    Response time guarantee: under 24 hours.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-xs"
                >
                  <span>Contact Privacy Officer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
