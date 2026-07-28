import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  monthlyLimit: number;
  currency: string;
  period: "monthly" | "yearly";
  isSample?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema<IBudget> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true },
    monthlyLimit: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    period: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
export default Budget;
