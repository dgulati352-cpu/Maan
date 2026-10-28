"use client";

import React, { useState } from "react";
import { Camera, Sparkles, ArrowRight, Menu, X, Search, UploadCloud, Heart, ShieldCheck } from "lucide-react";

interface NavbarProps {
  activeTab: "landing" | "search" | "upload";
  onTabChange: (tab: "landing" | "search" | "upload") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#F8F5EF]/90 backdrop-blur-md border-b border-[#DED5C8] transition-all w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => onTabChange("landing")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#C6A76A] to-[#B39355] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Camera className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#873F50] flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#242321]">
                  #Maan
                </span>
                <span className="text-[10px] tracking-widest font-semibold px-1.5 py-0.5 rounded-full bg-[#C6A76A]/20 text-[#242321] border border-[#C6A76A]/40 uppercase">
                  AI
                </span>
              </div>
              <span className="text-[10px] tracking-wider uppercase font-medium text-[#716B63]">
                Luxury Wedding Tech
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onTabChange("landing")}
              className={`text-sm tracking-wide font-medium transition-colors ${
                activeTab === "landing"
                  ? "text-[#873F50] font-semibold border-b-2 border-[#873F50] pb-1"
                  : "text-[#716B63] hover:text-[#242321]"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onTabChange("search")}
              className={`flex items-center gap-1.5 text-sm tracking-wide font-medium transition-colors ${
                activeTab === "search"
                  ? "text-[#873F50] font-semibold border-b-2 border-[#873F50] pb-1"
                  : "text-[#716B63] hover:text-[#242321]"
              }`}
            >
              <Search className="w-4 h-4 text-[#C6A76A]" />
              Find My Photos
            </button>
            <button
              onClick={() => onTabChange("upload")}
              className={`flex items-center gap-1.5 text-sm tracking-wide font-medium transition-colors ${
                activeTab === "upload"
                  ? "text-[#873F50] font-semibold border-b-2 border-[#873F50] pb-1"
                  : "text-[#716B63] hover:text-[#242321]"
              }`}
            >
              <UploadCloud className="w-4 h-4 text-[#C6A76A]" />
              Upload Photos
            </button>
            <a
              href="#how-it-works"
              onClick={() => {
                onTabChange("landing");
                setTimeout(() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }, 50);
              }}
              className="text-sm tracking-wide font-medium text-[#716B63] hover:text-[#242321] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => {
                onTabChange("landing");
                setTimeout(() => {
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                }, 50);
              }}
              className="text-sm tracking-wide font-medium text-[#716B63] hover:text-[#242321] transition-colors"
            >
              Pricing
            </a>
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => onTabChange("search")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide text-white bg-[#873F50] hover:bg-[#733443] transition-all shadow-md hover:shadow-lg active:scale-98"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onTabChange("search")}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#873F50] text-white"
            >
              Find Photos
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#242321] hover:bg-[#E8DDD0] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F8F5EF] border-b border-[#DED5C8] px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <button
            onClick={() => {
              onTabChange("landing");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-[#242321] hover:bg-[#E8DDD0]"
          >
            Home
          </button>
          <button
            onClick={() => {
              onTabChange("search");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-[#873F50] bg-[#E8DDD0]/50"
          >
            <Search className="w-4 h-4 text-[#C6A76A]" />
            Find My Photos (Selfie Search)
          </button>
          <button
            onClick={() => {
              onTabChange("upload");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-[#242321] hover:bg-[#E8DDD0]"
          >
            <UploadCloud className="w-4 h-4 text-[#C6A76A]" />
            Upload Wedding Photos
          </button>
          <a
            href="#how-it-works"
            onClick={() => {
              onTabChange("landing");
              setMobileMenuOpen(false);
            }}
            className="block py-2 px-3 rounded-lg text-sm font-medium text-[#716B63] hover:bg-[#E8DDD0]"
          >
            How It Works
          </a>
          <div className="pt-2">
            <button
              onClick={() => {
                onTabChange("search");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-white bg-[#873F50]"
            >
              <span>Find My Photos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
