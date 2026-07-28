import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import Subscription from "@/models/Subscription";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "monthly"; // daily, monthly, yearly

    await connectDB();

    // 1. Accounts & Net Worth
    const accounts = await Account.find({ userId: auth.userId });
    const netWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);

    // 2. Active Subscriptions Cost
    const subscriptions = await Subscription.find({ userId: auth.userId, status: "active" });
    const monthlySubscriptionCost = subscriptions.reduce((sum, sub) => {
      if (sub.billingCycle === "monthly") return sum + sub.amount;
      if (sub.billingCycle === "yearly") return sum + sub.amount / 12;
      if (sub.billingCycle === "weekly") return sum + (sub.amount * 52) / 12;
      if (sub.billingCycle === "quarterly") return sum + sub.amount / 3;
      return sum;
    }, 0);

    // 3. Transactions date ranges
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (timeframe === "daily") {
      // Last 14 days
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
    } else if (timeframe === "yearly") {
      // Last 5 years
      startDate = new Date(now.getFullYear() - 4, 0, 1);
    } else {
      // Monthly (Last 6 months)
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    const transactions = await Transaction.find({
      userId: auth.userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Current month stats for header metric cards
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const currentMonthTxs = await Transaction.find({
      userId: auth.userId,
      date: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });

    let currentMonthIncome = 0;
    let currentMonthExpense = 0;

    currentMonthTxs.forEach((tx) => {
      if (tx.type === "income") currentMonthIncome += tx.amount;
      if (tx.type === "expense") currentMonthExpense += tx.amount;
    });

    const savingsRate =
      currentMonthIncome > 0
        ? Math.max(0, Math.round(((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100))
        : 0;

    // Category Spending Breakdown (Donut Chart)
    const categoryMap: Record<string, number> = {};
    currentMonthTxs.forEach((tx) => {
      if (tx.type === "expense") {
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
      }
    });

    const categoryColors: Record<string, string> = {
      Housing: "#ef4444",
      Food: "#f97316",
      Transport: "#eab308",
      Tech: "#3b82f6",
      Utilities: "#06b6d4",
      Entertainment: "#a855f7",
      Health: "#ec4899",
      Shopping: "#10b981",
      Subscriptions: "#6366f1",
      General: "#64748b",
    };

    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: categoryColors[name] || "#8884d8",
    }));

    // Time-Series Trend Data for Recharts Bar/Line chart
    const trendMap: Record<string, { label: string; income: number; expense: number }> = {};

    if (timeframe === "daily") {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        trendMap[key] = { label, income: 0, expense: 0 };
      }

      transactions.forEach((tx) => {
        const key = new Date(tx.date).toISOString().split("T")[0];
        if (trendMap[key]) {
          if (tx.type === "income") trendMap[key].income += tx.amount;
          if (tx.type === "expense") trendMap[key].expense += tx.amount;
        }
      });
    } else if (timeframe === "yearly") {
      for (let i = 4; i >= 0; i--) {
        const yr = now.getFullYear() - i;
        const key = `${yr}`;
        trendMap[key] = { label: `${yr}`, income: 0, expense: 0 };
      }

      transactions.forEach((tx) => {
        const yr = new Date(tx.date).getFullYear();
        const key = `${yr}`;
        if (trendMap[key]) {
          if (tx.type === "income") trendMap[key].income += tx.amount;
          if (tx.type === "expense") trendMap[key].expense += tx.amount;
        }
      });
    } else {
      // Monthly
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        trendMap[key] = { label, income: 0, expense: 0 };
      }

      transactions.forEach((tx) => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (trendMap[key]) {
          if (tx.type === "income") trendMap[key].income += tx.amount;
          if (tx.type === "expense") trendMap[key].expense += tx.amount;
        }
      });
    }

    const trendData = Object.values(trendMap);

    return NextResponse.json({
      metrics: {
        netWorth: Math.round(netWorth * 100) / 100,
        monthlyIncome: Math.round(currentMonthIncome * 100) / 100,
        monthlyExpense: Math.round(currentMonthExpense * 100) / 100,
        savingsRate,
        monthlySubscriptionCost: Math.round(monthlySubscriptionCost * 100) / 100,
      },
      categoryData,
      trendData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fetch analytics failed" }, { status: 500 });
  }
}
