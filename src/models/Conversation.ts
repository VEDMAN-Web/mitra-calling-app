import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: {
    text: string;
    senderId: Types.ObjectId;
    createdAt: Date;
  };
  lastReadAt: Map<string, Date>;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: {
      text: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date },
    },
    lastReadAt: { type: Map, of: Date, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Conversation = model<IConversation>("Conversation", conversationSchema);
