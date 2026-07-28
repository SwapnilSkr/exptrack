import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const budgets = await Budget.find({ userId: auth.userId });

    // Calculate current month spending per category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const expenseTxs = await Transaction.find({
      userId: auth.userId,
      type: "expense",
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const categorySpending: Record<string, number> = {};
    expenseTxs.forEach((tx) => {
      categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
    });

    const budgetStats = budgets.map((b) => {
      const spent = categorySpending[b.category] || 0;
      const percentage = b.monthlyLimit > 0 ? Math.min(Math.round((spent / b.monthlyLimit) * 100), 100) : 0;
      return {
        _id: b._id,
        category: b.category,
        monthlyLimit: b.monthlyLimit,
        spent,
        remaining: Math.max(b.monthlyLimit - spent, 0),
        percentage,
        isOver: spent > b.monthlyLimit,
      };
    });

    return NextResponse.json({ budgets: budgetStats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fetch budgets failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category, monthlyLimit } = body;

    if (!category || monthlyLimit === undefined) {
      return NextResponse.json({ error: "Category and monthly limit required" }, { status: 400 });
    }

    await connectDB();

    const budget = await Budget.findOneAndUpdate(
      { userId: auth.userId, category },
      { monthlyLimit: Number(monthlyLimit) },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, budget });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Save budget failed" }, { status: 500 });
  }
}
