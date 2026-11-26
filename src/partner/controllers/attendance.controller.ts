import { Request, Response } from "express";
import { Partner } from "../../models/Partner";
import { Attendance } from "../../models/Attendance";
import { HttpError } from "../../common/utils/HttpError";
import { PARTNER_FIXED_DAILY_PAY } from "../../config/gifts";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function setAvailability(req: Request, res: Response) {
  const { isOnline } = req.body as { isOnline?: boolean };
  if (typeof isOnline !== "boolean") throw new HttpError(400, "isOnline must be a boolean");

  const partner = await Partner.findById(req.actor!.id);
  if (!partner) throw new HttpError(404, "Partner not found");
  if (isOnline && partner.verificationStatus !== "approved") {
    throw new HttpError(403, "Partner is not approved yet");
  }

  partner.isOnline = isOnline;
  await partner.save();

  if (isOnline) {
    await Attendance.findOneAndUpdate(
      { partnerId: partner._id, date: todayDateString() },
      { $setOnInsert: { fixedPayAmount: PARTNER_FIXED_DAILY_PAY, firstOnlineAt: new Date() } },
      { upsert: true }
    );
  }

  res.json({ isOnline: partner.isOnline });
}
