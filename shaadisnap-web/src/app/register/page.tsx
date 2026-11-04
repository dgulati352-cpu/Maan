"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("organizer");
  const [venue, setVenue] = useState("The Oberoi Udaivilas, Udaipur");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("Please accept the Terms of Service & Privacy Policy to proceed.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/admin");
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-[#F1D5D5]/40 via-[#D9B7A0]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[#A85D70]/10 via-[#F1D5D5]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-[24px] border border-[#EADDE0] shadow-sm relative z-10 text-left">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 rounded-full overflow-hidden mx-auto shadow-xs border border-[#A85D70]/30">
              <img src="/hero-couple.jpg" alt="Maan AI — Mahine Weds Anand @ The Oberoi Udaivilas" className="w-full h-full object-cover object-top" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#633C49]">
              Create Organizer Portal
            </h1>
            <p className="text-sm text-[#947A80]">
              Register your wedding celebration or photography studio account.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Mahine Kapoor"
                className="w-full h-11 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mahine@example.com"
                className="w-full h-11 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                  Confirm *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                Event Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] focus:outline-hidden focus:border-[#A85D70] transition-colors cursor-pointer"
              >
                <option value="organizer">Wedding Couple / Family Host</option>
                <option value="planner">Wedding Planner / Event Lead</option>
                <option value="studio">Studio Photographer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                Wedding Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="The Oberoi Udaivilas, Udaipur"
                className="w-full h-11 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] transition-colors"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#765D62]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#EADDE0] text-[#A85D70] focus:ring-[#A85D70] accent-[#A85D70]"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#A85D70] hover:underline font-semibold">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#A85D70] hover:underline font-semibold">
                    Privacy Policy (DPDP Act 2023)
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full font-semibold text-sm tracking-wide text-white bg-[#A85D70] hover:bg-[#914C60] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Organizer Account</span>
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

          {/* Login Link */}
          <div className="text-center text-xs text-[#765D62]">
            Already have an organizer account?{" "}
            <Link href="/login" className="font-semibold text-[#A85D70] hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
