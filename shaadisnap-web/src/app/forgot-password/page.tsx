"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
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
            <div className="w-12 h-12 rounded-full bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center mx-auto text-[#A85D70] shadow-xs">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#633C49]">
              Reset Password
            </h1>
            <p className="text-sm text-[#947A80]">
              Enter the email address associated with your organizer account, and we will send you secure recovery instructions.
            </p>
          </div>

          {isSent ? (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0] space-y-2">
                <CheckCircle2 className="w-6 h-6 text-[#477A5B] mx-auto" />
                <h2 className="font-serif text-base font-bold text-[#633C49]">
                  Check Your Inbox
                </h2>
                <p className="text-xs text-[#765D62] leading-relaxed">
                  If an account exists for <span className="font-semibold text-[#633C49]">{email}</span>, you will receive a secure password reset link within a few minutes.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#A85D70] hover:text-[#914C60] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#633C49] uppercase tracking-wider">
                  Email Address *
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-full font-semibold text-sm tracking-wide text-white bg-[#A85D70] hover:bg-[#914C60] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Sending instructions...</span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#765D62] hover:text-[#633C49] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#947A80]" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* Privacy Note */}
          <div className="pt-2 text-center text-xs text-[#947A80] flex items-center justify-center gap-1.5 border-t border-[#EADDE0]">
            <ShieldCheck className="w-4 h-4 text-[#477A5B]" />
            <span>Encrypted Token Verification • Zero Account Leaks</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
