import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const transaction = await Transaction.findOne({ _id: id, userId: auth.userId });
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Revert balance change
    const account = await Account.findById(transaction.accountId);
    if (account) {
      if (transaction.type === "expense") {
        account.balance += transaction.amount;
      } else if (transaction.type === "income") {
        account.balance -= transaction.amount;
      } else if (transaction.type === "transfer" && transaction.toAccountId) {
        account.balance += transaction.amount;
        const toAccount = await Account.findById(transaction.toAccountId);
        if (toAccount) {
          toAccount.balance -= transaction.amount;
          await toAccount.save();
        }
      }
      await account.save();
    }

    await Transaction.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: "Transaction deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}

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

    const existingTx = await Transaction.findOne({ _id: id, userId: auth.userId });
    if (!existingTx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Revert old transaction's effect on balances
    const oldAccount = await Account.findById(existingTx.accountId);
    if (oldAccount) {
      if (existingTx.type === "expense") oldAccount.balance += existingTx.amount;
      else if (existingTx.type === "income") oldAccount.balance -= existingTx.amount;
      else if (existingTx.type === "transfer" && existingTx.toAccountId) {
        oldAccount.balance += existingTx.amount;
        const oldToAccount = await Account.findById(existingTx.toAccountId);
        if (oldToAccount) {
          oldToAccount.balance -= existingTx.amount;
          await oldToAccount.save();
        }
      }
      await oldAccount.save();
    }

    // Apply updates
    existingTx.title = body.title ?? existingTx.title;
    existingTx.amount = body.amount !== undefined ? Number(body.amount) : existingTx.amount;
    existingTx.type = body.type ?? existingTx.type;
    existingTx.category = body.category ?? existingTx.category;
    existingTx.accountId = body.accountId ?? existingTx.accountId;
    existingTx.toAccountId = body.toAccountId ?? existingTx.toAccountId;
    existingTx.date = body.date ? new Date(body.date) : existingTx.date;
    existingTx.paymentMethod = body.paymentMethod ?? existingTx.paymentMethod;
    existingTx.notes = body.notes ?? existingTx.notes;
    if (body.tags) {
      existingTx.tags = Array.isArray(body.tags)
        ? body.tags
        : body.tags.split(",").map((t: string) => t.trim());
    }

    await existingTx.save();

    // Apply new transaction's effect on balances
    const newAccount = await Account.findById(existingTx.accountId);
    if (newAccount) {
      if (existingTx.type === "expense") newAccount.balance -= existingTx.amount;
      else if (existingTx.type === "income") newAccount.balance += existingTx.amount;
      else if (existingTx.type === "transfer" && existingTx.toAccountId) {
        newAccount.balance -= existingTx.amount;
        const newToAccount = await Account.findById(existingTx.toAccountId);
        if (newToAccount) {
          newToAccount.balance += existingTx.amount;
          await newToAccount.save();
        }
      }
      await newAccount.save();
    }

    return NextResponse.json({ success: true, transaction: existingTx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}
