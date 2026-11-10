"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getStoredGoogleUser, setStoredGoogleUser, GoogleDriveUser } from "@/lib/googleAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard ensures a 100% login-free experience for wedding guests across all devices.
 * Guests scanning QR codes or viewing galleries on mobile devices are never gated or redirected.
 * For administrative routes (/admin), automatically provisions an authorized organizer session.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) {
      const user = getStoredGoogleUser();
      if (!user || (!user.id && !user.email)) {
        const defaultAdmin: GoogleDriveUser = {
          id: "admin-marwaha-gulati",
          name: "Dhairya Gulati",
          email: "organizer@dhairya.ai",
          picture: "https://ui-avatars.com/api/?name=Dhairya+Gulati&background=F1D5D5&color=633C49",
          accessToken: "organizer-auto-token",
          scopes: ["organizer", "admin"],
          connectedAt: new Date().toISOString(),
        };
        setStoredGoogleUser(defaultAdmin);
      }
    }
  }, [isAdmin]);

  // All guest, mobile, and public routes render immediately with zero login walls
  return <>{children}</>;
};

