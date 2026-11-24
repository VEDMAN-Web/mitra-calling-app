import { Schema, model, Document } from "mongoose";

export interface IOtp extends Document {
  phone?: string;
  email?: string;
  code: string;
  expiresAt: Date;
}

const otpSchema = new Schema<IOtp>({
  phone: { type: String, index: true },
  email: { type: String, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

export const Otp = model<IOtp>("Otp", otpSchema);
