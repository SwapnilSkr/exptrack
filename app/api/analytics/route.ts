import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import { convertCurrency, fetchLiveExchangeRates } from "@/lib/currency";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "monthly"; // daily, monthly, yearly

    await connectDB();
    await fetchLiveExchangeRates();

    const user = await User.findById(auth.userId);
    const targetCurrency = user?.currency || "USD";

    // 1. Accounts & Net Worth converted to target currency using live rates
    const accounts = await Account.find({ userId: auth.userId });
    const netWorth = accounts.reduce((acc, curr) => {
      const accCurrency = curr.currency || "USD";
      return acc + convertCurrency(curr.balance, accCurrency, targetCurrency);
    }, 0);

    // 2. Active Subscriptions Cost
    const subscriptions = await Subscription.find({ userId: auth.userId, status: "active" });
    const monthlySubscriptionCost = subscriptions.reduce((sum, sub) => {
      const qty = sub.quantity || 1;
      const subAmount = sub.amount * qty;
      let monthlyVal = 0;
      if (sub.billingCycle === "monthly") monthlyVal = subAmount;
      else if (sub.billingCycle === "yearly") monthlyVal = subAmount / 12;
      else if (sub.billingCycle === "weekly") monthlyVal = (subAmount * 52) / 12;
      else if (sub.billingCycle === "quarterly") monthlyVal = subAmount / 3;

      return sum + monthlyVal;
    }, 0);

    // 3. Transactions date ranges
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (timeframe === "daily") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
    } else if (timeframe === "yearly") {
      startDate = new Date(now.getFullYear() - 4, 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    const transactions = await Transaction.find({
      userId: auth.userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Current month stats
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const currentMonthTxs = await Transaction.find({
      userId: auth.userId,
      date: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    currentMonthTxs.forEach((tx) => {
      if (tx.type === "income") monthlyIncome += tx.amount;
      if (tx.type === "expense") monthlyExpense += tx.amount;
    });

    const savingsRate =
      monthlyIncome > 0
        ? Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100))
        : 0;

    // Build trend chart data
    const trendMap = new Map<string, { label: string; income: number; expense: number }>();

    if (timeframe === "daily") {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        trendMap.set(key, { label, income: 0, expense: 0 });
      }

      transactions.forEach((tx) => {
        const key = new Date(tx.date).toISOString().split("T")[0];
        if (trendMap.has(key)) {
          const entry = trendMap.get(key)!;
          if (tx.type === "income") entry.income += tx.amount;
          if (tx.type === "expense") entry.expense += tx.amount;
        }
      });
    } else if (timeframe === "yearly") {
      for (let y = startDate.getFullYear(); y <= endDate.getFullYear(); y++) {
        const key = y.toString();
        trendMap.set(key, { label: key, income: 0, expense: 0 });
      }

      transactions.forEach((tx) => {
        const key = new Date(tx.date).getFullYear().toString();
        if (trendMap.has(key)) {
          const entry = trendMap.get(key)!;
          if (tx.type === "income") entry.income += tx.amount;
          if (tx.type === "expense") entry.expense += tx.amount;
        }
      });
    } else {
      // Monthly
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        trendMap.set(key, { label, income: 0, expense: 0 });
      }

      transactions.forEach((tx) => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (trendMap.has(key)) {
          const entry = trendMap.get(key)!;
          if (tx.type === "income") entry.income += tx.amount;
          if (tx.type === "expense") entry.expense += tx.amount;
        }
      });
    }

    // Category distribution for donut chart
    const categoryMap = new Map<string, number>();
    currentMonthTxs.forEach((tx) => {
      if (tx.type === "expense") {
        const cat = tx.category || "Uncategorized";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + tx.amount);
      }
    });

    const categoryColors: Record<string, string> = {
      Food: "#ef4444",
      Housing: "#3b82f6",
      Tech: "#8b5cf6",
      Entertainment: "#ec4899",
      Transport: "#f59e0b",
      Subscriptions: "#10b981",
      Health: "#06b6d4",
      Shopping: "#f97316",
    };

    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: categoryColors[name] || "#71717a",
    }));

    return NextResponse.json({
      metrics: {
        netWorth: Math.round(netWorth * 100) / 100,
        monthlyIncome: Math.round(monthlyIncome * 100) / 100,
        monthlyExpense: Math.round(monthlyExpense * 100) / 100,
        savingsRate,
        monthlySubscriptionCost: Math.round(monthlySubscriptionCost * 100) / 100,
        currency: targetCurrency,
      },
      trendData: Array.from(trendMap.values()),
      categoryData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fetch analytics failed" }, { status: 500 });
  }
}
