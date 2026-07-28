import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // income, expense, transfer
    const category = searchParams.get("category");
    const accountId = searchParams.get("accountId");
    const timeframe = searchParams.get("timeframe"); // daily, monthly, yearly, all
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const query: any = { userId: auth.userId };

    if (type && type !== "all") {
      query.type = type;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (accountId && accountId !== "all") {
      query.accountId = accountId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Timeframe date range logic
    const now = new Date();
    if (startDateParam && endDateParam) {
      query.date = { $gte: new Date(startDateParam), $lte: new Date(endDateParam) };
    } else if (timeframe === "daily") {
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
      .populate("accountId", "name type color icon")
      .populate("toAccountId", "name type color icon")
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, amount, type, category, accountId, toAccountId, date, tags, paymentMethod, notes } = body;

    if (!title || !amount || !type || !accountId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const transaction = await Transaction.create({
      userId: auth.userId,
      title,
      amount: Number(amount),
      type,
      category: category || "General",
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      date: date ? new Date(date) : new Date(),
      tags: Array.isArray(tags) ? tags : tags ? tags.split(",").map((t: string) => t.trim()) : [],
      paymentMethod: paymentMethod || "Card",
      notes: notes || "",
    });

    // Update account balances
    const account = await Account.findById(accountId);
    if (account) {
      if (type === "expense") {
        account.balance -= Number(amount);
      } else if (type === "income") {
        account.balance += Number(amount);
      } else if (type === "transfer" && toAccountId) {
        account.balance -= Number(amount);
        const toAccount = await Account.findById(toAccountId);
        if (toAccount) {
          toAccount.balance += Number(amount);
          await toAccount.save();
        }
      }
      await account.save();
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create transaction" }, { status: 500 });
  }
}
