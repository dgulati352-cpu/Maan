"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Images,
  Search,
  UploadCloud,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navLinks = [
    { name: "Overview & Metrics", href: "/admin", icon: LayoutDashboard },
    { name: "Photo Management Hub", href: "/admin/photos", icon: UploadCloud },
    { name: "Live Master Gallery", href: "/gallery", icon: Images, external: true },
    { name: "AI Face Search Tool", href: "/find-photos", icon: Search, external: true },
    { name: "Guest Photo Upload", href: "/upload-photos", icon: UploadCloud, external: true },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFF8F3] text-[#765D62]">
      
      {/* Mobile Top Header for Admin */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#EADDE0]">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#A85D70]/40 shadow-xs">
            <img src="/hero-couple.jpg" alt="ShaadiSnap AI — Mahine Weds Anand @ Deventure Shimla Hills Resort, Solan (HP)" className="w-full h-full object-cover object-top" />
          </div>
          <span className="font-serif text-lg font-bold text-[#633C49]">
            ShaadiSnap AI Organizer
          </span>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg text-[#633C49] hover:bg-[#F1D5D5]/50 transition-colors"
          aria-label="Toggle admin navigation"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 250px Fixed / Desktop Sidebar */}
      <aside
        className={`w-[250px] shrink-0 bg-white border-r border-[#EADDE0] flex flex-col justify-between p-6 z-40 transition-transform md:translate-x-0 ${
          mobileSidebarOpen
            ? "fixed inset-y-0 left-0 shadow-2xl block"
            : "hidden md:flex"
        }`}
      >
        <div className="space-y-6">
          {/* Brand & Event Switcher Plaque */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#A85D70]/40 shadow-xs flex-shrink-0">
                <img src="/hero-couple.jpg" alt="ShaadiSnap AI — Mahine Weds Anand @ Deventure Shimla Hills Resort, Solan (HP)" className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-xl font-bold tracking-tight text-[#633C49]">
                    ShaadiSnap
                  </span>
                  <span className="text-[9px] tracking-widest font-semibold px-1.5 py-0.5 rounded-full bg-[#F1D5D5] text-[#633C49] uppercase font-sans">
                    Organizer
                  </span>
                </div>
                <span className="text-[8px] uppercase tracking-wider text-[#947A80] font-semibold">
                  Marwaha &amp; Gulati Wedding
                </span>
              </div>
            </Link>

            {/* Active Event Plaque */}
            <div className="mt-5 p-3 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A85D70] block">
                Active Celebration
              </span>
              <p className="font-serif text-xs font-bold text-[#633C49] truncate">
                Marwaha &amp; Gulati Wedding
              </p>
              <p className="text-[11px] text-[#947A80] truncate">
                Deventure Shimla Hills Resort, Solan (HP)
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Admin Navigation">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#947A80] px-3 block mb-2">
              Management
            </span>
            {navLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#633C49] text-white shadow-xs"
                      : "text-[#765D62] hover:bg-[#FFF8F3] hover:text-[#633C49]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-[#A85D70]"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.external && (
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-[#EADDE0] space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#947A80]">
            <ShieldCheck className="w-4 h-4 text-[#477A5B] shrink-0" />
            <span className="text-[11px]">DPDP Act 2023 Vault Secured</span>
          </div>
          <Link
            href="/"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#633C49] hover:bg-[#FFF8F3] transition-colors"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-[#A85D70]" />
              <span>Back to Home</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#947A80]" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {children}
      </div>

    </div>
  );
}
