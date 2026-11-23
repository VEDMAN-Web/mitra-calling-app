import { Schema, model, Document, Types } from "mongoose";

export type CallType = "video" | "voice";
export type CallStatus = "ongoing" | "completed";

export interface ICallLog extends Document {
  _id: Types.ObjectId;
  callerId: Types.ObjectId;
  calleeId: Types.ObjectId;
  type: CallType;
  status: CallStatus;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  coinsCharged: number;
}

const callLogSchema = new Schema<ICallLog>({
  callerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  calleeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["video", "voice"], required: true },
  status: { type: String, enum: ["ongoing", "completed"], required: true, default: "ongoing" },
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date },
  durationSeconds: { type: Number },
  coinsCharged: { type: Number, required: true, default: 0 },
});

export const CallLog = model<ICallLog>("CallLog", callLogSchema);
