import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: "expense" | "income" | "transfer";
  title: string;
  amount: number;
  currency: string;
  category: string;
  accountId: mongoose.Types.ObjectId;
  toAccountId?: mongoose.Types.ObjectId;
  date: Date;
  tags?: string[];
  notes?: string;
  paymentMethod?: string;
  subscriptionId?: mongoose.Types.ObjectId;
  isSample?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["expense", "income", "transfer"], required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    category: { type: String, required: true, default: "General" },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    date: { type: Date, default: Date.now, index: true },
    tags: [{ type: String }],
    notes: { type: String, default: "" },
    paymentMethod: { type: String, default: "Card" },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription" },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
export default Transaction;
