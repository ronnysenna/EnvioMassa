import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json({ ok: true, message: "Restart requested" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
