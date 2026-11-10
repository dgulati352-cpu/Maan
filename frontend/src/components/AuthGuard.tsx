"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredGoogleUser } from "@/lib/googleAuth";
import { Lock, Sparkles } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/register",
  "/terms",
  "/privacy",
];

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname?.startsWith(route));

  const [isAuthenticated] = useState<boolean | null>(() => {
    if (typeof window === "undefined" || isPublic) return true;
    const user = getStoredGoogleUser();
    return !!(user && (user.id || user.email));
  });

  useEffect(() => {
    if (isPublic) return;

    // Check if user is signed in
    const user = getStoredGoogleUser();
    if (!user || (!user.id && !user.email)) {
      // Redirect to login page immediately
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
    }
  }, [pathname, router, isPublic]);

  // While determining auth state, show luxury rose champagne loading barrier
  if (isAuthenticated === null || isPublic) {
    if (isPublic) return <>{children}</>;

    return (
      <div className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full bg-[#F1D5D5] flex items-center justify-center animate-pulse border border-[#A85D70]/30 shadow-md">
            <Lock className="w-7 h-7 text-[#633C49]" />
          </div>
          <Sparkles className="w-4 h-4 text-[#A85D70] absolute -top-1 -right-1 animate-spin" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#633C49] mb-2">
          Private Royal Wedding Archive
        </h2>
        <p className="text-sm text-[#947A80] max-w-sm">
          Checking your guest access pass for Marwaha &amp; Gulati wedding gallery...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

