import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Subscription from "@/models/Subscription";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const subscriptions = await Subscription.find({ userId: auth.userId })
      .populate("accountId", "name type color icon")
      .sort({ nextBillingDate: 1 });

    // Calculate totals considering quantity
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    subscriptions.forEach((sub) => {
      if (sub.status === "active") {
        const qty = sub.quantity || 1;
        const totalSubAmount = sub.amount * qty;

        if (sub.billingCycle === "monthly") {
          monthlyTotal += totalSubAmount;
          yearlyTotal += totalSubAmount * 12;
        } else if (sub.billingCycle === "yearly") {
          monthlyTotal += totalSubAmount / 12;
          yearlyTotal += totalSubAmount;
        } else if (sub.billingCycle === "weekly") {
          monthlyTotal += (totalSubAmount * 52) / 12;
          yearlyTotal += totalSubAmount * 52;
        } else if (sub.billingCycle === "quarterly") {
          monthlyTotal += totalSubAmount / 3;
          yearlyTotal += totalSubAmount * 4;
        }
      }
    });

    return NextResponse.json({
      subscriptions,
      metrics: {
        totalMonthly: Math.round(monthlyTotal * 100) / 100,
        totalYearly: Math.round(yearlyTotal * 100) / 100,
        activeCount: subscriptions.filter((s) => s.status === "active").length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fetch subscriptions failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, amount, quantity, billingCycle, category, accountId, nextBillingDate, notes, autoRenew } = body;

    if (!name || amount === undefined || !accountId) {
      return NextResponse.json({ error: "Missing required subscription fields" }, { status: 400 });
    }

    const cycle = billingCycle || "monthly";
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;

    // Calculate default next billing date if not provided
    let computedNextDate: Date;
    if (nextBillingDate) {
      computedNextDate = new Date(nextBillingDate);
    } else {
      const now = new Date();
      computedNextDate = new Date(now);
      if (cycle === "weekly") {
        computedNextDate.setDate(now.getDate() + 7);
      } else if (cycle === "quarterly") {
        computedNextDate.setMonth(now.getMonth() + 3);
      } else if (cycle === "yearly") {
        computedNextDate.setFullYear(now.getFullYear() + 1);
      } else {
        // default monthly
        computedNextDate.setMonth(now.getMonth() + 1);
      }
    }

    await connectDB();

    const sub = await Subscription.create({
      userId: auth.userId,
      name,
      amount: Number(amount),
      quantity: qty,
      billingCycle: cycle,
      category: category || "Subscriptions",
      accountId,
      nextBillingDate: computedNextDate,
      startDate: new Date(),
      status: "active",
      autoRenew: autoRenew !== undefined ? autoRenew : true,
      notes: notes || "",
    });

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Create subscription failed" }, { status: 500 });
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
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 });
    }

    await connectDB();
    await Subscription.deleteOne({ _id: id, userId: auth.userId });

    return NextResponse.json({ success: true, message: "Subscription deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delete subscription failed" }, { status: 500 });
  }
}
