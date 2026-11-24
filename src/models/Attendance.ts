import { Schema, model, Document, Types } from "mongoose";

export interface IAttendance extends Document {
  partnerId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  fixedPayAmount: number;
  firstOnlineAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true, index: true },
  date: { type: String, required: true },
  fixedPayAmount: { type: Number, required: true },
  firstOnlineAt: { type: Date, required: true, default: Date.now },
});

attendanceSchema.index({ partnerId: 1, date: 1 }, { unique: true });

export const Attendance = model<IAttendance>("Attendance", attendanceSchema);
