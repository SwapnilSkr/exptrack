import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Account from "@/models/Account";
import User from "@/models/User";
import { convertCurrency } from "@/lib/currency";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(auth.userId);
    const targetCurrency = user?.currency || "USD";

    const accounts = await Account.find({ userId: auth.userId }).sort({ createdAt: 1 });

    // Compute converted total balance in target currency
    const totalBalance = accounts.reduce((acc, currAccount) => {
      const accCurrency = currAccount.currency || "USD";
      const converted = convertCurrency(currAccount.balance, accCurrency, targetCurrency);
      return acc + converted;
    }, 0);

    return NextResponse.json({ accounts, totalBalance, currency: targetCurrency });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fetch accounts failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, balance, color, icon, currency } = body;

    if (!name) {
      return NextResponse.json({ error: "Account name is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(auth.userId);

    const account = await Account.create({
      userId: auth.userId,
      name,
      type: type || "checking",
      balance: Number(balance) || 0,
      color: color || "#3b82f6",
      icon: icon || "Landmark",
      currency: currency || user?.currency || "USD",
    });

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Create account failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Account ID required" }, { status: 400 });
    }

    await connectDB();
    await Account.deleteOne({ _id: id, userId: auth.userId });

    return NextResponse.json({ success: true, message: "Account deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delete account failed" }, { status: 500 });
  }
}
