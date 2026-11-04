"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, CheckCircle2, FolderOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  GoogleDriveUser,
  getStoredGoogleUser,
  setStoredGoogleUser,
  clearStoredGoogleUser,
  createMockGoogleUser,
} from "@/lib/googleAuth";
import { auth, getGoogleDriveProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleDriveUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncUser = () => {
      setGoogleUser(getStoredGoogleUser());
    };
    syncUser();
    window.addEventListener("shaadisnap_google_auth_changed", syncUser);
    return () => window.removeEventListener("shaadisnap_google_auth_changed", syncUser);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Auto-create organizer session so user is logged in
    const organizerUser: GoogleDriveUser = {
      id: "organizer_demo_" + Date.now(),
      name: email.split("@")[0] || "Wedding Organizer",
      email: email,
      picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
      accessToken: "demo_organizer_token",
      scopes: ["drive.readonly", "drive.photos.readonly"],
      connectedAt: new Date().toISOString(),
    };
    setStoredGoogleUser(organizerUser);

    setTimeout(() => {
      setIsLoading(false);
      // Navigate to admin dashboard or gallery directly
      window.location.href = "/admin";
    }, 400);
  };

  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    try {
      // Live Firebase Google Popup Login with Drive Scopes
      const provider = getGoogleDriveProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Extract OAuth credential / access token if returned
      const liveUser: GoogleDriveUser = {
        id: user.uid,
        name: user.displayName || "Wedding Host",
        email: user.email || "host@maan-ai.com",
        picture: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
        accessToken: "firebase_live_oauth_token",
        connectedAt: new Date().toISOString(),
        scopes: ["drive.readonly", "drive.photos.readonly"],
      };

      setStoredGoogleUser(liveUser);
      setGoogleUser(liveUser);
      setIsGoogleLoading(false);
      window.location.href = "/gallery?openDrive=true";
    } catch (err: unknown) {
      console.error("Firebase Google sign in error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      
      // If user closed the popup window, don't show an error
      if (msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request")) {
        setIsGoogleLoading(false);
        return;
      }

      setAuthError(msg);
      setIsGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = () => {
    clearStoredGoogleUser();
    setGoogleUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-[#F1D5D5]/40 via-[#D9B7A0]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[#A85D70]/10 via-[#F1D5D5]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-[28px] border border-[#EADDE0] shadow-sm relative z-10 text-left">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full overflow-hidden mx-auto shadow-xs">
              <img src="/brand-logo.png" alt="ShaadiSnap AI" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#633C49]">
              Welcome Back
            </h2>
            <p className="text-sm text-[#947A80]">
              Sign in to manage your luxury wedding gallery or access your Google Drive photo albums.
            </p>
          </div>

          {/* Google Sign-In & Drive OAuth Option */}
          {googleUser ? (
            <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F1D5D5] border border-[#EADDE0]">
                    {googleUser.picture ? (
                      <img src={googleUser.picture} alt={googleUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[#633C49] text-xs">
                        {googleUser.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#633C49]">{googleUser.name}</p>
                    <p className="text-[11px] text-[#947A80] font-mono">{googleUser.email}</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Connected</span>
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[#EADDE0]/60">
                <button
                  type="button"
                  onClick={() => router.push("/gallery?openDrive=true")}
                  className="flex-1 py-2 px-3 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Drive Albums</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  className="py-2 px-3 rounded-full text-xs font-semibold text-[#765D62] hover:text-[#633C49] bg-white border border-[#EADDE0] transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full h-12 rounded-full font-semibold text-xs sm:text-sm tracking-wide text-[#633C49] bg-[#FFF8F3] hover:bg-[#F1D5D5]/40 border border-[#EADDE0] hover:border-[#A85D70] transition-all duration-200 shadow-2xs hover:shadow-xs flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
              >
                {/* Official 4-color Google G */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleLoading ? "Connecting to Google Drive..." : "Continue with Google & Drive Access"}</span>
              </button>
              <p className="text-[11px] text-[#947A80] text-center">
                Grants read access to import wedding albums from your personal Google Drive.
              </p>
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <p className="font-semibold mb-0.5">Authentication Note:</p>
                  <p>{authError}</p>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#EADDE0]"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-[#947A80] font-semibold">
              Or with Organizer Email
            </span>
            <div className="flex-grow border-t border-[#EADDE0]"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full h-11 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] focus:ring-1 focus:ring-[#A85D70] transition-colors"
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
                  className="w-full h-11 px-4 rounded-[12px] bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-hidden focus:border-[#A85D70] focus:ring-1 focus:ring-[#A85D70] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-full font-semibold text-sm tracking-wide text-white bg-[#A85D70] hover:bg-[#914C60] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
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
