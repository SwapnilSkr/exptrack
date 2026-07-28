import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Subscription from "@/models/Subscription";

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

    await connectDB();

    const sub = await Subscription.findOne({ _id: id, userId: auth.userId });
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (body.name !== undefined) sub.name = body.name;
    if (body.amount !== undefined) sub.amount = Number(body.amount);
    if (body.quantity !== undefined) sub.quantity = Number(body.quantity);
    if (body.currency !== undefined) sub.currency = body.currency;
    if (body.billingCycle !== undefined) sub.billingCycle = body.billingCycle;
    if (body.category !== undefined) sub.category = body.category;
    if (body.accountId !== undefined) sub.accountId = body.accountId;
    if (body.status !== undefined) sub.status = body.status;
    if (body.nextBillingDate !== undefined) sub.nextBillingDate = new Date(body.nextBillingDate);
    if (body.notes !== undefined) sub.notes = body.notes;

    await sub.save();

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update subscription failed" }, { status: 500 });
  }
}
