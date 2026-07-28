import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  quantity: number;
  currency: string;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly";
  category: string;
  accountId: mongoose.Types.ObjectId;
  nextBillingDate: Date;
  startDate: Date;
  status: "active" | "paused" | "cancelled";
  autoRenew: boolean;
  notes?: string;
  isSample?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema<ISubscription> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    currency: { type: String, default: "USD" },
    billingCycle: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly"],
      default: "monthly",
    },
    category: { type: String, required: true, default: "Subscriptions" },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    nextBillingDate: { type: Date, required: true },
    startDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "paused", "cancelled"], default: "active" },
    autoRenew: { type: Boolean, default: true },
    notes: { type: String, default: "" },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;
