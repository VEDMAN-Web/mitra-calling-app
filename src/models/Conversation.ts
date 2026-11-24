import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  partnerId: Types.ObjectId;
  lastMessage?: {
    text: string;
    senderRole: "user" | "partner";
    createdAt: Date;
  };
  userLastReadAt: Date;
  partnerLastReadAt: Date;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
    lastMessage: {
      text: { type: String },
      senderRole: { type: String, enum: ["user", "partner"] },
      createdAt: { type: Date },
    },
    userLastReadAt: { type: Date, required: true, default: () => new Date(0) },
    partnerLastReadAt: { type: Date, required: true, default: () => new Date(0) },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

conversationSchema.index({ userId: 1, partnerId: 1 }, { unique: true });

export const Conversation = model<IConversation>("Conversation", conversationSchema);
