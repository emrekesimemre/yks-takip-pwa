import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mongoose = await connectMongo();
    const ready = mongoose.connection.readyState === 1;
    if (!ready) {
      return NextResponse.json(
        { ok: false, mongo: "disconnected" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      mongo: "ok",
    });
  } catch (error) {
    console.error("Health check başarısız:", error);
    return NextResponse.json({ ok: false, mongo: "error" }, { status: 503 });
  }
}
