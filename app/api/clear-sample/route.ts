import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Transaction from "@/models/Transaction";
import Subscription from "@/models/Subscription";
import Budget from "@/models/Budget";
import Account from "@/models/Account";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "sample_only"; // sample_only vs all

    await connectDB();

    if (mode === "all") {
      await Transaction.deleteMany({ userId: auth.userId });
      await Subscription.deleteMany({ userId: auth.userId });
      await Budget.deleteMany({ userId: auth.userId });
      await Account.deleteMany({ userId: auth.userId });
    } else {
      await Transaction.deleteMany({ userId: auth.userId, isSample: true });
      await Subscription.deleteMany({ userId: auth.userId, isSample: true });
      await Budget.deleteMany({ userId: auth.userId, isSample: true });
      await Account.deleteMany({ userId: auth.userId, isSample: true });
    }

    return NextResponse.json({
      success: true,
      message: mode === "all" ? "All financial data cleared successfully." : "All sample data purged successfully.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Clear data failed" }, { status: 500 });
  }
}
