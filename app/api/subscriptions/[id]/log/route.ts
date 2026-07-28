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
    let seatCount = 1;

    try {
      const body = await req.json();
      if (body.mode) mode = body.mode;
      if (body.seatCount) seatCount = Number(body.seatCount);
    } catch {
      // default mode 'all'
    }

    await connectDB();

    const sub = await Subscription.findOne({ _id: id, userId: auth.userId }).populate("accountId");
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const totalSeats = sub.quantity || 1;
    const countToLog = mode === "single" ? Math.min(seatCount, totalSeats) : totalSeats;
    const totalAmount = sub.amount * countToLog;

    const itemTitle =
      totalSeats > 1
        ? mode === "single"
          ? `${sub.name} (1 Seat)`
          : `${sub.name} (x${totalSeats} Seats)`
        : `${sub.name} Subscription`;

    const resolvedCurrency = sub.currency || (sub.accountId as any)?.currency || "USD";

    // 1. Create Posted Expense Transaction
    const transaction = await Transaction.create({
      userId: auth.userId,
      title: itemTitle,
      amount: totalAmount,
      currency: resolvedCurrency,
      type: "expense",
      category: sub.category || "Subscriptions",
      accountId: sub.accountId,
      date: sub.nextBillingDate || new Date(),
      tags: ["Subscription", sub.name.toLowerCase(), mode === "single" ? "SingleSeat" : "AllSeats"],
      paymentMethod: "Auto-Pay",
      notes: `Logged ${mode === "single" ? "1 seat" : `all ${totalSeats} seats`} for recurring subscription ${sub.name}`,
      subscriptionId: sub._id,
    });

    // 2. Update Account Balance
    const account = await Account.findById(sub.accountId);
    if (account) {
      account.balance -= totalAmount;
      await account.save();
    }

    // 3. Advance Next Billing Date (full cycle if 'all', proportional if 'single')
    if (mode === "all" || totalSeats === 1) {
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
    }

    return NextResponse.json({
      success: true,
      message: `Logged ${mode === "single" ? "1 seat" : `all ${totalSeats} seats`} for ${sub.name} (${formatCurrency(totalAmount, resolvedCurrency)}).`,
      transaction,
      subscription: sub,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Log subscription expense failed" }, { status: 500 });
  }
}
