"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, UploadCloud, Shield, Lock, Award, Play, Share2 } from "lucide-react";
import { getWeddingPhotos } from "@/lib/weddingPhotoStore";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { ShareGuestLinkModal } from "@/components/ShareGuestLinkModal";

interface HeroProps {
  onFindPhotos: () => void;
  onUploadPhotos: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onFindPhotos, onUploadPhotos }) => {
  const [livePhotos, setLivePhotos] = useState<WeddingPhoto[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const syncLivePhotos = () => {
      setLivePhotos(getWeddingPhotos());
    };
    syncLivePhotos();
    window.addEventListener("shaadisnap_photos_updated", syncLivePhotos);
    return () => window.removeEventListener("shaadisnap_photos_updated", syncLivePhotos);
  }, []);

  const liveCount = livePhotos.length;
  const coupleHeroImage = "/hero-couple.jpg";
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Royal Ambient Glows & Atmosphere */}
      <div className="absolute top-0 right-1/4 -mt-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#A85D70]/15 via-[#F1D5D5]/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#633C49]/10 via-[#A85D70]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="editorial-grid absolute inset-0 pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Elevated Gold Foil Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/65 border border-[#D9B7A0]/60 text-[#633C49] text-[10px] font-bold tracking-[0.18em] uppercase shadow-[0_8px_24px_rgba(99,60,73,0.08)] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A85D70] animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-[#A85D70]" />
              <span>The private wedding photo archive</span>
            </div>

            {/* Three-Line Editorial Headline */}
            <div className="space-y-3">
              <p className="editorial-kicker text-xs sm:text-sm">Marwaha &amp; Gulati Wedding • Deventure Shimla Hills Resort, Solan (HP)</p>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-fluid-display font-bold tracking-[-0.03em] text-[#633C49] leading-[1.08] sm:leading-[0.98]">
                Every Moment.<br />
                Every Memory.<br />
                <span className="bg-gradient-to-r from-[#633C49] via-[#A85D70] to-[#D9B7A0] bg-clip-text text-transparent italic font-normal">
                  Yours to Find.
                </span>
              </h1>
            </div>

            {/* Supporting Editorial Description */}
            <p className="text-sm sm:text-base lg:text-lg text-[#765D62] max-w-xl font-normal leading-[1.65] sm:leading-[1.75]">
              Thousands of wedding photos. One simple selfie. Discover every moment you were part of with <strong className="text-[#633C49] font-semibold">Marwaha &amp; Gulati Wedding</strong>.
            </p>

            {/* Luxury CTAs */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={onFindPhotos}
                className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#633C49] hover:bg-[#914C60] border border-[#D9B7A0]/40 shadow-[0_14px_30px_-8px_rgba(99,60,73,0.65)] hover:shadow-[0_18px_38px_-8px_rgba(99,60,73,0.75)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
              >
                <span>Find My Photos</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-semibold text-[#633C49] bg-[#F1D5D5]/50 hover:bg-[#F1D5D5] border border-[#A85D70]/40 hover:border-[#A85D70] backdrop-blur-md shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#A85D70]" />
                <span>Share Guest Pass &amp; QR</span>
              </button>

              <button
                onClick={onUploadPhotos}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-semibold text-[#633C49] bg-white/70 hover:bg-white backdrop-blur-md border border-[#D9B7A0]/70 hover:border-[#A85D70] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-[#A85D70]" />
                <span>Upload Wedding Candids</span>
              </button>
            </div>

            {/* Subtle Luxury Trust Badges */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-3 text-[11px] text-[#765D62]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-[#633C49]">Zero-Retention Ephemeral AI</span>
              </div>
              <span className="text-[#D9B7A0]">•</span>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#A85D70]" />
                <span className="font-medium text-[#633C49]">256-Bit Biometric Vault</span>
              </div>
              <span className="text-[#D9B7A0]">•</span>
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-[#A85D70]" />
                <span className="font-medium text-[#633C49]">Full HD Master Downloads</span>
              </div>
            </div>

          </div>

          {/* Right Column: Luxury Indian Royal Wedding Portrait with Architectural Framing */}
          <div className="lg:col-span-5 relative">
            
            <div className="relative mx-auto max-w-md lg:max-w-none lg:translate-y-2">
              
              {/* Outer Decorative Gold Foil Line Art Border */}
              <div className="absolute -inset-3 rounded-3xl border border-[#A85D70]/30 pointer-events-none transform rotate-1 scale-[1.01]" />
              <div className="absolute -inset-1 rounded-3xl border border-[#A85D70]/20 pointer-events-none transform -rotate-1" />

              {/* Ornate Corner Accents */}
              <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[#A85D70] rounded-tl-lg pointer-events-none z-20" />
              <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#A85D70] rounded-tr-lg pointer-events-none z-20" />
              <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-[#A85D70] rounded-bl-lg pointer-events-none z-20" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[#A85D70] rounded-br-lg pointer-events-none z-20" />
              
              {/* Main Image Container */}
              <div className="photo-card-sheen relative rounded-[28px] overflow-hidden shadow-[0_30px_70px_-18px_rgba(99,60,73,0.34)] border-[6px] border-white aspect-[4/5] bg-[#F1D5D5]/30">
                <img
                  src={coupleHeroImage}
                  alt="Mahine and Anand Royal Wedding Couple"
                  className="w-full h-full object-cover object-top transform hover:scale-103 transition-transform duration-700"
                />

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Bottom Luxury Caption Plaque */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 p-3 sm:p-4 rounded-2xl bg-black/55 backdrop-blur-md border border-white/20 text-white z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#D9B7A0] font-semibold truncate">Deventure Shimla Hills Resort, Solan (HP)</p>
                      </div>
                      <p className="font-serif text-sm sm:text-lg font-bold mt-0.5 text-white truncate">Marwaha &amp; Gulati Celebration</p>
                    </div>
                    <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {liveCount === 1 ? "1 Live Photo" : `${liveCount} Live Photos`}
                    </span>
                  </div>
                </div>
              </div>

              {/* A small editorial note makes the hero feel like a magazine cover. */}
              <div className="absolute -bottom-4 sm:-bottom-7 left-2 sm:-left-8 glass-panel rounded-2xl px-3 py-2 sm:px-4 sm:py-3 z-20 flex items-center gap-2.5 sm:gap-3 max-w-[calc(100%-16px)] sm:max-w-none shadow-md">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#633C49] flex items-center justify-center text-white shadow-md shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] font-bold text-[#A85D70]">A softer way to remember</p>
                  <p className="font-serif text-xs sm:text-sm font-semibold text-[#633C49] truncate">Made for the moments between poses</p>
                </div>
              </div>

              {/* Floating Luxury Biometric Shield Badge */}
              <div className="absolute -top-3 sm:-top-4 right-2 sm:-right-4 bg-white/95 backdrop-blur-xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-full shadow-[0_10px_25px_-5px_rgba(168,93,112,0.25)] border border-[#A85D70]/40 flex items-center gap-2 sm:gap-2.5 z-20">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#A85D70] to-[#633C49] flex items-center justify-center text-white shadow-xs shrink-0">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#633C49] tracking-wide">Private Biometric Vault</span>
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#A85D70] font-semibold">DPDP &amp; GDPR Compliant</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      <ShareGuestLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </section>
  );
};
