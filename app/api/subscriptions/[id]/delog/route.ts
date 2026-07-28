import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Subscription from "@/models/Subscription";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import { formatCurrency } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let mode: "all" | "single" = "all";

    try {
      const body = await req.json();
      if (body.mode) mode = body.mode;
    } catch {
      // default mode 'all'
    }

    await connectDB();

    const sub = await Subscription.findOne({ _id: id, userId: auth.userId }).populate("accountId");
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const totalSeats = sub.quantity || 1;
    const resolvedCurrency = sub.currency || (sub.accountId as any)?.currency || "USD";

    // 1. Find the latest matching transaction (single seat vs all seats or any latest)
    const tagFilter = mode === "single" ? "SingleSeat" : "AllSeats";
    let latestTx = await Transaction.findOne({
      userId: auth.userId,
      subscriptionId: sub._id,
      tags: { $in: [tagFilter] },
    }).sort({ date: -1, createdAt: -1 });

    if (!latestTx) {
      latestTx = await Transaction.findOne({
        userId: auth.userId,
        subscriptionId: sub._id,
      }).sort({ date: -1, createdAt: -1 });
    }

    let deloggedAmount = sub.amount * (mode === "single" ? 1 : totalSeats);

    if (latestTx) {
      deloggedAmount = latestTx.amount;
      const account = await Account.findById(latestTx.accountId || sub.accountId);
      if (account) {
        account.balance += latestTx.amount;
        await account.save();
      }
      await Transaction.deleteOne({ _id: latestTx._id });
    } else {
      const account = await Account.findById(sub.accountId);
      if (account) {
        account.balance += deloggedAmount;
        await account.save();
      }
    }

    // 2. Roll back Next Billing Date if 'all' or single seat rollback
    if (mode === "all" || totalSeats === 1) {
      const nextDate = new Date(sub.nextBillingDate || Date.now());
      if (sub.billingCycle === "weekly") {
        nextDate.setDate(nextDate.getDate() - 7);
      } else if (sub.billingCycle === "monthly") {
        nextDate.setMonth(nextDate.getMonth() - 1);
      } else if (sub.billingCycle === "quarterly") {
        nextDate.setMonth(nextDate.getMonth() - 3);
      } else if (sub.billingCycle === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() - 1);
      }
      sub.nextBillingDate = nextDate;
      await sub.save();
    }

    return NextResponse.json({
      success: true,
      message: `Delogged ${mode === "single" ? "1 seat" : `all ${totalSeats} seats`} for ${sub.name} (${formatCurrency(deloggedAmount, resolvedCurrency)}). Restored account balance.`,
      subscription: sub,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delog subscription expense failed" }, { status: 500 });
  }
}
