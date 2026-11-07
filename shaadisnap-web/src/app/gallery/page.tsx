"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { FullWeddingGallery } from "@/components/FullWeddingGallery";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function GalleryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar activeTab="gallery" />
      <main className="flex-1">
        <FullWeddingGallery
          onFindPhotos={() => router.push("/find-photos")}
        />
      </main>
      <Footer />
    </div>
  );
}

