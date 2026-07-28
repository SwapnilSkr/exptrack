import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: "checking" | "savings" | "credit" | "cash" | "investment" | "crypto";
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isSample?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema<IAccount> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["checking", "savings", "credit", "cash", "investment", "crypto"],
      default: "checking",
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    color: { type: String, default: "#3b82f6" },
    icon: { type: String, default: "Landmark" },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Account: Model<IAccount> = mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema);
export default Account;
