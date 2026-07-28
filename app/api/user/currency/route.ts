import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currency } = await req.json();
    if (!currency) {
      return NextResponse.json({ error: "Currency code required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      auth.userId,
      { currency },
      { new: true }
    ).select("-passwordHash");

    return NextResponse.json({ success: true, currency: user?.currency });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update currency failed" }, { status: 500 });
  }
}
