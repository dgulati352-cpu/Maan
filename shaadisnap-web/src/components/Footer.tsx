"use client";

import React from "react";
import { Camera, Sparkles, ShieldCheck, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#242321] text-[#E8DDD0] pt-16 pb-12 border-t border-white/10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C6A76A] to-[#B39355] flex items-center justify-center shadow-xs">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                #Maan
              </span>
              <span className="text-[10px] tracking-widest font-semibold px-1.5 py-0.5 rounded-full bg-[#C6A76A]/20 text-[#C6A76A] border border-[#C6A76A]/40 uppercase">
                AI
              </span>
            </div>
            <p className="text-xs text-[#E8DDD0]/70 leading-relaxed">
              Every Moment. Every Memory. Yours to Find. Luxury AI-powered wedding photo discovery designed for modern Indian celebrations.
            </p>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-[#E8DDD0]/70">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Face Search</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guest Uploads</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Photographer Studio</a></li>
            </ul>
          </div>

          {/* Col 3: Privacy & Security */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Privacy & Trust
            </h4>
            <ul className="space-y-2 text-xs text-[#E8DDD0]/70">
              <li><a href="#" className="hover:text-white transition-colors">DPDP Act 2023 Compliance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GDPR Biometric Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ephemeral Face Data Erasure</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security Architecture</a></li>
            </ul>
          </div>

          {/* Col 4: Trust Badge */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Biometric Guarantee
            </h4>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#C6A76A] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Public Scraping</span>
              </div>
              <p className="text-[11px] text-[#E8DDD0]/60 leading-relaxed">
                Guest selfies are processed ephemerally and never used to train public face models or sold to third parties.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E8DDD0]/50 gap-4">
          <p>© 2026 #Maan Wedding AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted with <Heart className="w-3.5 h-3.5 text-[#873F50] fill-[#873F50]" /> for luxury Indian weddings.
          </p>
        </div>
      </div>
    </footer>
  );
};
