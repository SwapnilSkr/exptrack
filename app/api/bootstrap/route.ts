import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import Subscription from "@/models/Subscription";
import Budget from "@/models/Budget";
import { convertCurrency, fetchLiveExchangeRates } from "@/lib/currency";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    fetchLiveExchangeRates().catch(() => {}); // Non-blocking background rate sync

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "monthly";

    // 1. Fetch User, Accounts, Subscriptions, Budgets, Transactions concurrently
    const [user, accounts, subscriptions, budgets] = await Promise.all([
      User.findById(auth.userId).select("-passwordHash"),
      Account.find({ userId: auth.userId }),
      Subscription.find({ userId: auth.userId }).populate("accountId", "name type color icon currency"),
      Budget.find({ userId: auth.userId }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const targetCurrency = user.currency || "INR";

    // 2. Fetch Transactions for specified timeframe
    const now = new Date();
    const query: any = { userId: auth.userId };
    if (timeframe === "daily") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (timeframe === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (timeframe === "yearly") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      query.date = { $gte: startOfYear, $lte: endOfYear };
    }

    const transactions = await Transaction.find(query)
      .populate("accountId", "name type color icon currency")
      .populate("toAccountId", "name type color icon currency")
      .sort({ date: -1, createdAt: -1 });

    // 3. Compute Accounts Total Balance converted to target currency
    let totalAccountBalance = 0;
    const formattedAccounts = accounts.map((acc) => {
      const accCurrency = acc.currency || targetCurrency;
      const convertedBal = convertCurrency(acc.balance, accCurrency, targetCurrency);
      totalAccountBalance += convertedBal;
      return {
        _id: acc._id,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        currency: accCurrency,
        color: acc.color,
        icon: acc.icon,
      };
    });

    // 4. Compute Subscriptions Metrics
    let monthlySubCost = 0;
    let yearlySubCost = 0;
    subscriptions.forEach((sub) => {
      if (sub.status === "active") {
        const qty = sub.quantity || 1;
        const subCurrency = sub.currency || (sub.accountId as any)?.currency || targetCurrency;
        const baseAmount = convertCurrency(sub.amount * qty, subCurrency, targetCurrency);

        if (sub.billingCycle === "monthly") {
          monthlySubCost += baseAmount;
          yearlySubCost += baseAmount * 12;
        } else if (sub.billingCycle === "yearly") {
          monthlySubCost += baseAmount / 12;
          yearlySubCost += baseAmount;
        } else if (sub.billingCycle === "weekly") {
          monthlySubCost += (baseAmount * 52) / 12;
          yearlySubCost += baseAmount * 52;
        } else if (sub.billingCycle === "quarterly") {
          monthlySubCost += baseAmount / 3;
          yearlySubCost += baseAmount * 4;
        }
      }
    });

    // 5. Compute Income & Expense Analytics for timeframe
    let incomeTotal = 0;
    let expenseTotal = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach((tx) => {
      const txCurrency = tx.currency || (tx.accountId as any)?.currency || targetCurrency;
      const convertedAmt = convertCurrency(tx.amount, txCurrency, targetCurrency);

      if (tx.type === "income") {
        incomeTotal += convertedAmt;
      } else if (tx.type === "expense") {
        expenseTotal += convertedAmt;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + convertedAmt;
      }
    });

    const categoryColors: Record<string, string> = {
      Housing: "#3b82f6",
      Food: "#10b981",
      Transport: "#f59e0b",
      Tech: "#8b5cf6",
      Utilities: "#ec4899",
      Entertainment: "#06b6d4",
      Health: "#ef4444",
      Shopping: "#f97316",
      Subscriptions: "#a855f7",
      General: "#64748b",
    };

    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: categoryColors[name] || "#94a3b8",
    }));

    const savingsRate = incomeTotal > 0 ? Math.max(Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100), 0) : 0;

    const budgetStats = budgets.map((b) => {
      const bCurrency = b.currency || targetCurrency;
      const spentInTarget = categoryTotals[b.category] || 0;
      const spent = convertCurrency(spentInTarget, targetCurrency, bCurrency);
      const percentage = b.monthlyLimit > 0 ? Math.min(Math.round((spent / b.monthlyLimit) * 100), 100) : 0;
      return {
        _id: b._id,
        category: b.category,
        monthlyLimit: b.monthlyLimit,
        currency: bCurrency,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.max(Math.round((b.monthlyLimit - spent) * 100) / 100, 0),
        percentage,
        isOver: spent > b.monthlyLimit,
      };
    });

    return NextResponse.json({
      user,
      accounts: formattedAccounts,
      totalAccountBalance: Math.round(totalAccountBalance * 100) / 100,
      transactions,
      subscriptions,
      subMetrics: {
        totalMonthly: Math.round(monthlySubCost * 100) / 100,
        totalYearly: Math.round(yearlySubCost * 100) / 100,
        activeCount: subscriptions.filter((s) => s.status === "active").length,
      },
      budgets: budgetStats,
      analytics: {
        metrics: {
          netWorth: Math.round(totalAccountBalance * 100) / 100,
          monthlyIncome: Math.round(incomeTotal * 100) / 100,
          monthlyExpense: Math.round(expenseTotal * 100) / 100,
          savingsRate,
          monthlySubscriptionCost: Math.round(monthlySubCost * 100) / 100,
          currency: targetCurrency,
        },
        categoryData,
        trendData: [
          { label: timeframe.toUpperCase(), income: Math.round(incomeTotal * 100) / 100, expense: Math.round(expenseTotal * 100) / 100 },
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Bootstrap fetch failed" }, { status: 500 });
  }
}
