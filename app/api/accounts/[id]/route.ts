import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Account from "@/models/Account";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, type, balance, color, currency } = body;

    await connectDB();

    const account = await Account.findOne({ _id: id, userId: auth.userId });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (name) account.name = name;
    if (type) account.type = type;
    if (balance !== undefined) account.balance = Number(balance);
    if (color) account.color = color;
    if (currency) account.currency = currency;

    await account.save();

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update account failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    await Account.deleteOne({ _id: id, userId: auth.userId });

    return NextResponse.json({ success: true, message: "Account deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delete account failed" }, { status: 500 });
  }
}
