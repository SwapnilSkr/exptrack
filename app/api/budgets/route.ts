import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(auth.userId);
    const userCurrency = user?.currency || "USD";

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
        currency: b.currency || userCurrency,
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
    const { category, monthlyLimit, currency } = body;

    if (!category || monthlyLimit === undefined) {
      return NextResponse.json({ error: "Category and monthly limit required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(auth.userId);
    const resolvedCurrency = currency || user?.currency || "USD";

    const budget = await Budget.findOneAndUpdate(
      { userId: auth.userId, category },
      { monthlyLimit: Number(monthlyLimit), currency: resolvedCurrency },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, budget });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Save budget failed" }, { status: 500 });
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
      return NextResponse.json({ error: "Budget ID required" }, { status: 400 });
    }

    await connectDB();
    await Budget.deleteOne({ _id: id, userId: auth.userId });

    return NextResponse.json({ success: true, message: "Budget deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delete budget failed" }, { status: 500 });
  }
}
