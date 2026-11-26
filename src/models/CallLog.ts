import { Schema, model, Document, Types } from "mongoose";

export type CallType = "video";
export type CallStatus = "pending" | "ongoing" | "declined" | "completed";

export interface ICallLog extends Document {
  _id: Types.ObjectId;
  callerId: Types.ObjectId;
  partnerId: Types.ObjectId;
  type: CallType;
  status: CallStatus;
  requestedAt: Date;
  acceptedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  diamondsCharged: number;
}

const callLogSchema = new Schema<ICallLog>({
  callerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
  type: { type: String, enum: ["video"], required: true },
  status: { type: String, enum: ["pending", "ongoing", "declined", "completed"], required: true, default: "pending" },
  requestedAt: { type: Date, required: true, default: Date.now },
  acceptedAt: { type: Date },
  endedAt: { type: Date },
  durationSeconds: { type: Number },
  diamondsCharged: { type: Number, required: true, default: 0 },
});

export const CallLog = model<ICallLog>("CallLog", callLogSchema);
