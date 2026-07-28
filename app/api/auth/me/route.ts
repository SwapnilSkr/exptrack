import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.userId).select("-passwordHash");

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        _id: user._id.toString(),
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        currency: user.currency,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
