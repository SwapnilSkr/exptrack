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

    const qty = sub.quantity || 1;
    const totalAmount = sub.amount * qty;
    const itemTitle = qty > 1 ? `${sub.name} (x${qty}) Subscription` : `${sub.name} Subscription`;
    const resolvedCurrency = sub.currency || (sub.accountId as any)?.currency || "USD";

    // 1. Create Posted Expense Transaction with matching subscription currency
    const transaction = await Transaction.create({
      userId: auth.userId,
      title: itemTitle,
      amount: totalAmount,
      currency: resolvedCurrency,
      type: "expense",
      category: sub.category || "Subscriptions",
      accountId: sub.accountId,
      date: sub.nextBillingDate || new Date(),
      tags: ["Subscription", sub.name.toLowerCase()],
      paymentMethod: "Auto-Pay",
      notes: `Logged automatically from recurring subscription ${sub.name} (qty: ${qty})`,
      subscriptionId: sub._id,
    });

    // 2. Update Account Balance
    const account = await Account.findById(sub.accountId);
    if (account) {
      account.balance -= totalAmount;
      await account.save();
    }

    // 3. Advance Next Billing Date
    const nextDate = new Date(sub.nextBillingDate || Date.now());
    if (sub.billingCycle === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (sub.billingCycle === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (sub.billingCycle === "quarterly") {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (sub.billingCycle === "yearly") {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    sub.nextBillingDate = nextDate;
    await sub.save();

    return NextResponse.json({
      success: true,
      message: `Expense logged for ${sub.name} (${formatCurrency(totalAmount, resolvedCurrency)}). Next renewal set to ${nextDate.toISOString().split("T")[0]}`,
      transaction,
      subscription: sub,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Log subscription expense failed" }, { status: 500 });
  }
}
