import { Schema, model, Document, Types } from "mongoose";

export type VerificationStatus = "not_submitted" | "in_review" | "approved" | "rejected";
export type IdDocumentType = "aadhaar" | "driving_licence" | "passport" | "voter_id";

export interface IPartner extends Document {
  _id: Types.ObjectId;
  phone: string;
  name: string;
  age?: number;
  languages: string[];
  bio?: string;
  avatarUrl?: string;
  isOnline: boolean;
  verificationStatus: VerificationStatus;
  idDocument?: {
    type: IdDocumentType;
    imageUrl: string;
  };
  selfieImageUrl?: string;
  rejectionReason?: string;
  createdAt: Date;
}

const partnerSchema = new Schema<IPartner>(
  {
    phone: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, min: 18 },
    languages: [{ type: String }],
    bio: { type: String },
    avatarUrl: { type: String },
    isOnline: { type: Boolean, required: true, default: false },
    verificationStatus: {
      type: String,
      enum: ["not_submitted", "in_review", "approved", "rejected"],
      required: true,
      default: "not_submitted",
    },
    idDocument: {
      type: { type: String, enum: ["aadhaar", "driving_licence", "passport", "voter_id"] },
      imageUrl: { type: String },
    },
    selfieImageUrl: { type: String },
    rejectionReason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Partner = model<IPartner>("Partner", partnerSchema);
