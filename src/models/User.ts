import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  isGuest: boolean;
  phone?: string;
  email?: string;
  name: string;
  age?: number;
  bio?: string;
  avatarUrl?: string;
  imageUrl?: string;
  diamondBalance: number;
  favorites: Types.ObjectId[];
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    isGuest: { type: Boolean, required: true, default: false },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    name: { type: String, required: true },
    age: { type: Number, min: 18 },
    bio: { type: String },
    avatarUrl: { type: String },
    imageUrl: { type: String },
    diamondBalance: { type: Number, required: true, default: 100 },
    favorites: [{ type: Schema.Types.ObjectId, ref: "Partner", default: [] }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User = model<IUser>("User", userSchema);
