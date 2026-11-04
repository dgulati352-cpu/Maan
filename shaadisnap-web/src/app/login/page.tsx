"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/find-photos");
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-[#F1D5D5]/40 via-[#D9B7A0]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[#A85D70]/10 via-[#F1D5D5]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-[24px] border border-[#EADDE0] shadow-sm relative z-10 text-left">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full overflow-hidden mx-auto shadow-xs">
              <img src="/brand-logo.png" alt="ShaadiSnap AI" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#633C49]">
              Welcome Back
            </h2>
            <p className="text-sm text-[#947A80]">
              Sign in to manage your luxury wedding gallery or retrieve your guest memories.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] focus:ring-1 focus:ring-[#A85D70] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#A85D70] hover:text-[#914C60] font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] focus:ring-1 focus:ring-[#A85D70] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full font-semibold text-sm tracking-wide text-white bg-[#A85D70] hover:bg-[#914C60] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="pt-2 text-center text-xs text-[#947A80] flex items-center justify-center gap-1.5 border-t border-[#EADDE0]">
            <ShieldCheck className="w-4 h-4 text-[#477A5B]" />
            <span>256-Bit Encrypted • DPDP & GDPR Compliant</span>
          </div>

          {/* Alternative Links */}
          <div className="text-center text-xs text-[#765D62] space-y-1.5">
            <div>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#A85D70] hover:underline">
                Create Organizer Account
              </Link>
            </div>
            <div>
              Guest looking for photos?{" "}
              <Link href="/find-photos" className="font-semibold text-[#A85D70] hover:underline">
                Search by Selfie
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

