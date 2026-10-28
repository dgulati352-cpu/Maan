import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "#Maan — Every Moment. Every Memory. Yours to Find.",
  description:
    "Luxury AI-powered wedding photo discovery and sharing platform. Find and download all your wedding photos instantly with private selfie face-matching.",
  keywords: [
    "#Maan",
    "wedding photo discovery",
    "wedding photo discovery",
    "AI face recognition wedding",
    "Indian wedding photography",
    "wedding photo sharing",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8F5EF] text-[#242321]">
        {children}
      </body>
    </html>
  );
}
