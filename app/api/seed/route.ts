import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import Subscription from "@/models/Subscription";
import Budget from "@/models/Budget";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // 1. Check if user already has accounts
    let checkingAccount = await Account.findOne({ userId: auth.userId, name: "Chase Checking" });
    let creditCard = await Account.findOne({ userId: auth.userId, name: "Amex Gold Card" });
    let savingsAccount = await Account.findOne({ userId: auth.userId, name: "High Yield Savings" });

    if (!checkingAccount) {
      checkingAccount = await Account.create({
        userId: auth.userId,
        name: "Chase Checking",
        type: "checking",
        balance: 4850.0,
        color: "#3b82f6",
        icon: "Landmark",
        isSample: true,
      });
    }

    if (!creditCard) {
      creditCard = await Account.create({
        userId: auth.userId,
        name: "Amex Gold Card",
        type: "credit",
        balance: -640.5,
        color: "#f59e0b",
        icon: "CreditCard",
        isSample: true,
      });
    }

    if (!savingsAccount) {
      savingsAccount = await Account.create({
        userId: auth.userId,
        name: "High Yield Savings",
        type: "savings",
        balance: 14200.0,
        color: "#10b981",
        icon: "PiggyBank",
        isSample: true,
      });
    }

    // 2. Clear old sample transactions & subscriptions to re-seed cleanly
    await Transaction.deleteMany({ userId: auth.userId, isSample: true });
    await Subscription.deleteMany({ userId: auth.userId, isSample: true });
    await Budget.deleteMany({ userId: auth.userId, isSample: true });

    // 3. Create Sample Subscriptions
    const now = new Date();
    const sub1 = await Subscription.create({
      userId: auth.userId,
      name: "Netflix Premium 4K",
      amount: 22.99,
      billingCycle: "monthly",
      category: "Subscriptions",
      accountId: creditCard._id,
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
      status: "active",
      autoRenew: true,
      isSample: true,
    });

    const sub2 = await Subscription.create({
      userId: auth.userId,
      name: "Spotify Family Plan",
      amount: 16.99,
      billingCycle: "monthly",
      category: "Subscriptions",
      accountId: checkingAccount._id,
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 11),
      status: "active",
      autoRenew: true,
      isSample: true,
    });

    const sub3 = await Subscription.create({
      userId: auth.userId,
      name: "ChatGPT Plus",
      amount: 20.0,
      billingCycle: "monthly",
      category: "Tech",
      accountId: creditCard._id,
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6),
      status: "active",
      autoRenew: true,
      isSample: true,
    });

    const sub4 = await Subscription.create({
      userId: auth.userId,
      name: "Equinox Gym Pass",
      amount: 149.0,
      billingCycle: "monthly",
      category: "Health",
      accountId: checkingAccount._id,
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 18),
      status: "active",
      autoRenew: true,
      isSample: true,
    });

    // 4. Create Sample Budgets
    await Budget.insertMany([
      { userId: auth.userId, category: "Food", monthlyLimit: 600, isSample: true },
      { userId: auth.userId, category: "Housing", monthlyLimit: 1800, isSample: true },
      { userId: auth.userId, category: "Tech", monthlyLimit: 400, isSample: true },
      { userId: auth.userId, category: "Entertainment", monthlyLimit: 300, isSample: true },
      { userId: auth.userId, category: "Transport", monthlyLimit: 250, isSample: true },
      { userId: auth.userId, category: "Subscriptions", monthlyLimit: 150, isSample: true },
    ]);

    // 5. Create Sample Transactions (Income & Expenses across past 30 days)
    const sampleTxs = [
      {
        userId: auth.userId,
        type: "income",
        title: "Bi-Weekly Salary Payout",
        amount: 3600.0,
        category: "Salary",
        accountId: checkingAccount._id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        tags: ["Salary", "DirectDeposit"],
        paymentMethod: "Direct Deposit",
        notes: "Tech Corp Payroll",
        isSample: true,
      },
      {
        userId: auth.userId,
        type: "expense",
        title: "Whole Foods Market Grocery Run",
        amount: 142.85,
        category: "Food",
        accountId: creditCard._id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        tags: ["Groceries", "Organic"],
        paymentMethod: "Card",
        notes: "Weekly organic meal prep",
        isSample: true,
      },
      {
        userId: auth.userId,
        type: "expense",
        title: "Apple Store - MagSafe Charger",
        amount: 39.0,
        category: "Tech",
        accountId: creditCard._id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
        tags: ["Accessories", "Apple"],
        paymentMethod: "Apple Pay",
        notes: "Travel charger",
        isSample: true,
      },
      {
        userId: auth.userId,
        type: "expense",
        title: "Uber Ride to Airport",
        amount: 48.5,
        category: "Transport",
        accountId: creditCard._id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
        tags: ["Travel", "Uber"],
        paymentMethod: "Card",
        isSample: true,
      },
      {
        userId: auth.userId,
        type: "expense",
        title: "Luxury Apartment Rent Payment",
        amount: 1750.0,
        category: "Housing",
        accountId: checkingAccount._id,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        tags: ["Rent", "Housing"],
        paymentMethod: "Bank Transfer",
        isSample: true,
      },
      {
        userId: auth.userId,
        type: "income",
        title: "Freelance UI Design Client Payment",
        amount: 1250.0,
        category: "Freelance",
        accountId: checkingAccount._id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
        tags: ["SideHustle", "Design"],
        paymentMethod: "Stripe",
        isSample: true,
      },
      {
        userId: auth.userId,
        type: "expense",
        title: "Dinner at Bistro & Cocktail Bar",
        amount: 118.4,
        category: "Food",
        accountId: creditCard._id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
        tags: ["DiningOut", "Weekend"],
        paymentMethod: "Card",
        isSample: true,
      },
      {
        userId: auth.userId,
        type: "expense",
        title: "ChatGPT Plus Subscription",
        amount: 20.0,
        category: "Tech",
        accountId: creditCard._id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12),
        tags: ["Subscription", "AI"],
        paymentMethod: "Auto-Pay",
        subscriptionId: sub3._id,
        isSample: true,
      },
      {
        userId: auth.userId,
        type: "transfer",
        title: "Monthly Emergency Savings Transfer",
        amount: 500.0,
        category: "General",
        accountId: checkingAccount._id,
        toAccountId: savingsAccount._id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4),
        tags: ["SavingsGoal"],
        paymentMethod: "Bank Transfer",
        isSample: true,
      },
    ];

    await Transaction.insertMany(sampleTxs);

    return NextResponse.json({
      success: true,
      message: "Sample financial data seeded successfully! You can explore all features now.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Seed data failed" }, { status: 500 });
  }
}
