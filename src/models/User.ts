import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  isGuest: boolean;
  phone?: string;
  name: string;
  age?: number;
  bio?: string;
  avatarUrl?: string;
  coinBalance: number;
  favorites: Types.ObjectId[];
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    isGuest: { type: Boolean, required: true, default: false },
    phone: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    age: { type: Number, min: 18 },
    bio: { type: String },
    avatarUrl: { type: String },
    coinBalance: { type: Number, required: true, default: 100 },
    favorites: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User = model<IUser>("User", userSchema);
