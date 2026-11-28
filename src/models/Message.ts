import { Schema, model, Document, Types } from "mongoose";

export type MessageType = "text" | "call";
export type CallMessageStatus = "answered" | "declined";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderRole: "user" | "partner";
  type: MessageType;
  text?: string;
  call?: {
    status: CallMessageStatus;
    callerRole: "user" | "partner";
    durationSeconds?: number;
  };
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderRole: { type: String, enum: ["user", "partner"], required: true },
    type: { type: String, enum: ["text", "call"], required: true, default: "text" },
    text: { type: String },
    call: {
      status: { type: String, enum: ["answered", "declined"] },
      callerRole: { type: String, enum: ["user", "partner"] },
      durationSeconds: { type: Number },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Message = model<IMessage>("Message", messageSchema);
