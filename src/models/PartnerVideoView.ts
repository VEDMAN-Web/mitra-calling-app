import { Schema, model, Document, Types } from "mongoose";

export interface IPartnerVideoView extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  partnerId: Types.ObjectId;
  watchedUrls: string[];
}

const partnerVideoViewSchema = new Schema<IPartnerVideoView>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
    watchedUrls: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

partnerVideoViewSchema.index({ userId: 1, partnerId: 1 }, { unique: true });

export const PartnerVideoView = model<IPartnerVideoView>("PartnerVideoView", partnerVideoViewSchema);
