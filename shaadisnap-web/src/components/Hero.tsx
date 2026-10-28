"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, ArrowRight, UploadCloud, Star, CheckCircle2, Shield } from "lucide-react";

interface HeroProps {
  onFindPhotos: () => void;
  onUploadPhotos: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onFindPhotos, onUploadPhotos }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Decorative Floral / Mandala background accents */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-[#E8DDD0]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-[#C6A76A]/15 blur-3xl pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Small Gold Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8DDD0] border border-[#C6A76A]/40 text-[#242321] text-xs font-semibold tracking-wider uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A76A]" />
              <span>AI-Powered Wedding Photo Discovery</span>
            </div>

            {/* Three-Line Editorial Headline */}
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#242321] leading-[1.08]">
              Every Moment.<br />
              Every Memory.<br />
              <span className="text-[#873F50] italic font-normal">Yours to Find.</span>
            </h1>

            {/* Supporting Description */}
            <p className="text-lg sm:text-xl text-[#716B63] max-w-xl font-normal leading-relaxed">
              No more scrolling through thousands of uncurated gallery pictures. Snap a quick selfie,
              and our privacy-first facial AI instantly gathers every portrait, candid, and group photo you appear in.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onFindPhotos}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#873F50] hover:bg-[#733443] transition-all duration-200 shadow-md hover:shadow-xl active:scale-98"
              >
                <span>Find My Photos</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onUploadPhotos}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full text-base font-semibold text-[#242321] bg-white border border-[#C6A76A] hover:bg-[#E8DDD0]/40 transition-all duration-200 shadow-xs hover:border-[#B39355]"
              >
                <UploadCloud className="w-4 h-4 text-[#C6A76A]" />
                <span>Upload Photos</span>
              </button>
            </div>

            {/* Social Proof Section */}
            <div className="pt-4 border-t border-[#DED5C8]/80 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Guest Avatars */}
              <div className="flex -space-x-2 overflow-hidden">
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-[#F8F5EF] object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Guest avatar"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-[#F8F5EF] object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Guest avatar"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-[#F8F5EF] object-cover"
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                  alt="Guest avatar"
                />
                <div className="h-10 w-10 rounded-full bg-[#E8DDD0] border border-[#C6A76A]/40 flex items-center justify-center text-xs font-semibold text-[#873F50] ring-2 ring-[#F8F5EF]">
                  +2.4k
                </div>
              </div>

              {/* Stars & Editable Rating */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C6A76A] text-[#C6A76A]" />
                  ))}
                  <span className="ml-1 text-sm font-bold text-[#242321]">4.9 / 5.0</span>
                </div>
                <span className="text-xs text-[#716B63]">
                  Trusted by 2,400+ guests across luxury destination weddings
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Luxury Indian Wedding Photography & Floating UI Card */}
          <div className="lg:col-span-5 relative">
            
            {/* Fine Champagne Gold Frame */}
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative line-art frame */}
              <div className="absolute -inset-2.5 rounded-3xl border border-[#C6A76A]/40 pointer-events-none transform rotate-1 scale-[1.01]" />
              
              {/* Main Image Container */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white aspect-[4/5] bg-[#E8DDD0]">
                <img
                  src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85"
                  alt="Bride and groom at luxury royal Indian wedding"
                  className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-700"
                />

                {/* Subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                {/* Image caption watermark */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#E8DDD0] font-medium">Udaipur, Rajasthan</p>
                      <p className="font-serif text-lg font-bold">Simran & Karan&apos;s Royal Wedding</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                      1,420 Photos
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Match Result Demonstration Card */}
              <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-[#DED5C8] max-w-xs transition-transform hover:-translate-y-1 duration-300">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                      alt="Matched Guest"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-[#C6A76A]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#873F50] text-white flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[#873F50] uppercase tracking-wide">Match Found</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-[#242321]">42 Photos for Ananya</p>
                    <p className="text-[11px] text-[#716B63]">Confidence: 98.4% (ArcFace)</p>
                  </div>
                </div>
              </div>

              {/* Floating Privacy Badge */}
              <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-[#C6A76A]/40 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C6A76A]" />
                <span className="text-xs font-semibold text-[#242321]">DPDP & GDPR Protected</span>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
