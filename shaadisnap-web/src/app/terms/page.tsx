"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollText, ShieldCheck, HeartHandshake, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar />

      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1D5D5]/60 border border-[#EADDE0] text-xs font-semibold tracking-widest uppercase text-[#633C49]">
              <ScrollText className="w-4 h-4 text-[#A85D70]" />
              <span>Platform Agreement</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#633C49]">
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg text-[#765D62] max-w-2xl mx-auto leading-relaxed">
              Welcome to ShaadiSnap AI. These terms establish the transparent agreement between couples, wedding guests, professional studios, and our platform.
            </p>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-2xl p-7 border border-[#EADDE0] shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#633C49]">
                Photo Ownership Retained
              </h2>
              <p className="text-xs sm:text-sm text-[#765D62] leading-relaxed">
                You and your wedding photographers always retain 100% intellectual property rights over all images uploaded to your private event gallery.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-[#EADDE0] shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#633C49]">
                Private Event Isolation
              </h2>
              <p className="text-xs sm:text-sm text-[#765D62] leading-relaxed">
                Photos are accessible solely to authorized wedding attendees via invitation links or QR codes. Albums are never indexed on public search engines.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-[#EADDE0] shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#633C49]">
                Guest Discretion
              </h2>
              <p className="text-xs sm:text-sm text-[#765D62] leading-relaxed">
                AI facial search is completely optional. Guests can always browse and download wedding moments through standard chronological ceremony albums.
              </p>
            </div>
          </div>

          {/* Detailed Terms */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EADDE0] shadow-xs space-y-10 max-w-4xl mx-auto">
            
            <section className="space-y-4">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>1. Acceptance of Terms</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                By accessing ShaadiSnap AI, uploading photographs, scanning event QR codes, or utilizing facial search, you agree to comply with and be bound by these Terms of Service. If you are using the platform on behalf of a wedding organizer, studio, or event planner, you represent that you have authority to bind that entity.
              </p>
            </section>

            <section className="space-y-4 border-t border-[#EADDE0] pt-8">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>2. Permitted Use & Guest Upload Etiquette</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                ShaadiSnap AI is designed exclusively for celebration memories. Users agree that:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[#765D62] pl-4 list-disc">
                <li>All uploaded images must have been captured at or in connection with the designated wedding celebration.</li>
                <li>You will not upload defamatory, harassing, illicit, or unauthorized third-party content.</li>
                <li>Files must be genuine image formats (JPG, PNG, WebP, HEIC) within the 20MB file size limit.</li>
                <li>Any attempt to reverse engineer biometric models, harvest photos, or bypass security boundaries will result in immediate termination of access.</li>
              </ul>
            </section>

            <section className="space-y-4 border-t border-[#EADDE0] pt-8">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>3. Intellectual Property & Limited Platform License</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                ShaadiSnap AI claims no ownership over user-submitted photographs. By uploading, you grant ShaadiSnap AI a non-exclusive, worldwide, royalty-free license solely to host, cache, display, generate thumbnails, and perform ArcFace vector indexing necessary to deliver platform features to event attendees. This license terminates automatically when photos are removed.
              </p>
            </section>

            <section className="space-y-4 border-t border-[#EADDE0] pt-8">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>4. Service Availability & Master Resolution Downloads</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                We make every commercially reasonable effort to ensure uninterrupted 24/7 access and uncompressed master resolution download speeds. Wedding albums are preserved for the active celebration period contracted by the couple or studio, with guaranteed advance notice provided prior to album archiving.
              </p>
            </section>

            <section className="space-y-4 border-t border-[#EADDE0] pt-8">
              <h3 className="font-serif text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#A85D70]" />
                <span>5. Governing Law & Dispute Resolution</span>
              </h3>
              <p className="text-sm text-[#765D62] leading-relaxed">
                These terms are governed by and construed in accordance with the laws of India. Any legal dispute or controversy arising out of or related to the platform shall be subject to the exclusive jurisdiction of the competent courts in New Delhi or Udaipur, Rajasthan.
              </p>
              <div className="pt-4 flex items-center justify-between text-xs text-[#947A80] border-t border-[#EADDE0]/60">
                <span>Last updated: October 2026</span>
                <Link href="/contact" className="text-[#A85D70] font-semibold hover:underline">
                  Inquiries? Contact Concierge
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
