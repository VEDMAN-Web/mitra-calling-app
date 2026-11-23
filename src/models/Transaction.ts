import { Schema, model, Document, Types } from "mongoose";

export type TransactionType = "purchase" | "call_deduction" | "signup_bonus";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["purchase", "call_deduction", "signup_bonus"], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
