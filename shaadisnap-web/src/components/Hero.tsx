"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, ArrowRight, UploadCloud, Shield, Lock, Award, Heart } from "lucide-react";

interface HeroProps {
  onFindPhotos: () => void;
  onUploadPhotos: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onFindPhotos, onUploadPhotos }) => {
  return (
    <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28">
      {/* Royal Ambient Glows & Atmosphere */}
      <div className="absolute top-0 right-1/4 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#C6A76A]/15 via-[#E8DDD0]/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#873F50]/10 via-[#C6A76A]/10 to-transparent blur-3xl pointer-events-none" />
      
      {/* Delicate Architectural Background Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#C6A76A_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.12] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-9 text-left">
            
            {/* Elevated Gold Foil Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FAF4EA] via-[#F4EBD9] to-[#FAF4EA] border border-[#C6A76A]/50 text-[#6B2C3B] text-xs font-semibold tracking-widest uppercase shadow-[0_2px_12px_rgba(198,167,106,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6A76A] animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-[#C6A76A]" />
              <span>Bespoke Facial Recognition • Live Wedding Gallery</span>
            </div>

            {/* Three-Line Editorial Headline */}
            <div className="space-y-2">
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[76px] font-bold tracking-tight text-[#1A1918] leading-[1.06]">
                Every Moment.<br />
                Every Memory.<br />
                <span className="bg-gradient-to-r from-[#873F50] via-[#A84A60] to-[#C6A76A] bg-clip-text text-transparent italic font-normal">
                  Yours to Find.
                </span>
              </h1>
            </div>

            {/* Supporting Editorial Description */}
            <p className="text-lg sm:text-xl text-[#5F5850] max-w-xl font-normal leading-relaxed">
              Bid farewell to scrolling through endless uncurated gallery albums. With a single private selfie, our biometric engine instantly gathers every portrait, candid, and royal memory featuring you.
            </p>

            {/* Luxury CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onFindPhotos}
                className="group relative inline-flex items-center justify-center gap-3 px-9 py-4.5 rounded-full text-base font-semibold text-white bg-gradient-to-r from-[#702939] via-[#873F50] to-[#5E1F2E] hover:from-[#60212F] hover:via-[#7A3646] hover:to-[#501925] border border-[#E0C794]/40 shadow-[0_12px_28px_-6px_rgba(135,63,80,0.45)] hover:shadow-[0_18px_36px_-6px_rgba(135,63,80,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <span>Find My Photos</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onUploadPhotos}
                className="inline-flex items-center justify-center gap-3 px-8 py-4.5 rounded-full text-base font-semibold text-[#242321] bg-white/80 hover:bg-[#FAF6EE] backdrop-blur-md border border-[#C6A76A]/60 hover:border-[#C6A76A] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <UploadCloud className="w-4 h-4 text-[#C6A76A]" />
                <span>Upload Wedding Candids</span>
              </button>
            </div>

            {/* Subtle Luxury Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-[#716B63]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-[#242321]">Zero-Retention Ephemeral AI</span>
              </div>
              <span className="text-[#C6A76A]">•</span>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#C6A76A]" />
                <span className="font-medium text-[#242321]">256-Bit Biometric Vault</span>
              </div>
              <span className="text-[#C6A76A]">•</span>
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-[#C6A76A]" />
                <span className="font-medium text-[#242321]">Full HD Master Downloads</span>
              </div>
            </div>

          </div>

          {/* Right Column: Luxury Indian Royal Wedding Portrait with Architectural Framing */}
          <div className="lg:col-span-5 relative">
            
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Decorative Gold Foil Line Art Border */}
              <div className="absolute -inset-3 rounded-3xl border border-[#C6A76A]/40 pointer-events-none transform rotate-1 scale-[1.01]" />
              <div className="absolute -inset-1 rounded-3xl border border-[#C6A76A]/20 pointer-events-none transform -rotate-1" />

              {/* Ornate Corner Accents */}
              <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[#C6A76A] rounded-tl-lg pointer-events-none z-20" />
              <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#C6A76A] rounded-tr-lg pointer-events-none z-20" />
              <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-[#C6A76A] rounded-bl-lg pointer-events-none z-20" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[#C6A76A] rounded-br-lg pointer-events-none z-20" />
              
              {/* Main Image Container */}
              <div className="relative rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(36,35,33,0.22)] border-2 border-white aspect-[4/5] bg-[#E8DDD0]">
                <img
                  src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85"
                  alt="Bride and groom in royal regal Indian wedding attire"
                  className="w-full h-full object-cover object-center transform hover:scale-103 transition-transform duration-700"
                />

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                {/* Bottom Luxury Caption Plaque */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-[11px] uppercase tracking-widest text-[#E8DDD0] font-semibold">The Oberoi Udaivilas, Udaipur</p>
                      </div>
                      <p className="font-serif text-lg font-bold mt-0.5 text-white">Simran & Karan&apos;s Royal Celebration</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                      1,420 Photos
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Luxury Biometric Shield Badge */}
              <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-[0_10px_25px_-5px_rgba(198,167,106,0.3)] border border-[#C6A76A]/50 flex items-center gap-2.5 z-20">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C6A76A] to-[#B39355] flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#242321] tracking-wide">Private Biometric Vault</span>
                  <span className="text-[9px] uppercase tracking-wider text-[#873F50] font-semibold">DPDP & GDPR Compliant</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
