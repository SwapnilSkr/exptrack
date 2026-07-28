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
    await connectDB();

    const sub = await Subscription.findOne({ _id: id, userId: auth.userId }).populate("accountId");
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // 1. Find most recent transaction created for this subscription
    const latestTx = await Transaction.findOne({
      userId: auth.userId,
      subscriptionId: sub._id,
    }).sort({ date: -1, createdAt: -1 });

    const qty = sub.quantity || 1;
    const totalAmount = sub.amount * qty;
    const resolvedCurrency = sub.currency || (sub.accountId as any)?.currency || "USD";

    if (latestTx) {
      // Revert account balance
      const account = await Account.findById(latestTx.accountId || sub.accountId);
      if (account) {
        account.balance += latestTx.amount;
        await account.save();
      }

      // Delete the transaction record
      await Transaction.deleteOne({ _id: latestTx._id });
    } else {
      // If no explicit subscriptionId tx found, still revert account balance if account exists
      const account = await Account.findById(sub.accountId);
      if (account) {
        account.balance += totalAmount;
        await account.save();
      }
    }

    // 2. Roll back Next Billing Date by 1 cycle
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

    return NextResponse.json({
      success: true,
      message: `Delogged subscription for ${sub.name} (${formatCurrency(totalAmount, resolvedCurrency)}). Restored account balance and reset renewal to ${nextDate.toISOString().split("T")[0]}`,
      subscription: sub,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delog subscription expense failed" }, { status: 500 });
  }
}
