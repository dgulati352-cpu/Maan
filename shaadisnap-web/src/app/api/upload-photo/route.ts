import { NextRequest, NextResponse } from "next/server";

const GOOGLE_APPS_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwNSX6iRCcQS_ImqeS9MJ-CZYy02hz39BIfiyRAm20tP9ytxe3FGFMI76rXY6lq-hDQ/exec";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ceremony = (formData.get("ceremony") as string) || "Sangeet";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const payload = {
      filename: `${ceremony}_${Date.now()}_${file.name}`,
      mimeType: file.type || "image/jpeg",
      base64: base64,
      ceremony: ceremony,
    };

    // Forward to Google Apps Script Web App
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const data = await response.json();

    if (data.status === "error" || !data.id) {
      return NextResponse.json(
        { error: data.message || "Failed to upload to Google Drive" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileId: data.id,
      url: `https://lh3.googleusercontent.com/d/${data.id}=w1200`,
      name: file.name,
      ceremony: ceremony,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
