import { Schema, model, Document, Types } from "mongoose";

export type PartnerTransactionType = "gift_bonus";

export interface IPartnerTransaction extends Document {
  partnerId: Types.ObjectId;
  type: PartnerTransactionType;
  amountCoins: number;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const partnerTransactionSchema = new Schema<IPartnerTransaction>(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true, index: true },
    type: { type: String, enum: ["gift_bonus"], required: true },
    amountCoins: { type: Number, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PartnerTransaction = model<IPartnerTransaction>("PartnerTransaction", partnerTransactionSchema);
