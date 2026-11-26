import { Request, Response } from "express";
import { Types } from "mongoose";
import { Partner } from "../../models/Partner";
import { Attendance } from "../../models/Attendance";
import { CallLog } from "../../models/CallLog";
import { PartnerTransaction } from "../../models/PartnerTransaction";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboard(req: Request, res: Response) {
  const partnerId = req.actor!.id;
  const today = todayDateString();
  const startOfDay = new Date(`${today}T00:00:00.000Z`);

  const attendance = await Attendance.findOne({ partnerId, date: today });
  const giftBonusAgg = await PartnerTransaction.aggregate([
    { $match: { partnerId: new Types.ObjectId(partnerId), createdAt: { $gte: startOfDay } } },
    { $group: { _id: null, total: { $sum: "$amountDiamonds" } } },
  ]);
  const callsToday = await CallLog.find({
    partnerId,
    status: "completed",
    requestedAt: { $gte: startOfDay },
  }).select("durationSeconds");

  const callsCompleted = callsToday.length;
  const totalTalkSeconds = callsToday.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
  const avgCallDurationSeconds = callsCompleted ? Math.round(totalTalkSeconds / callsCompleted) : 0;

  res.json({
    isOnline: (await Partner.findById(partnerId).select("isOnline"))?.isOnline ?? false,
    fixedPayToday: attendance?.fixedPayAmount ?? 0,
    giftBonusToday: giftBonusAgg[0]?.total ?? 0,
    callsCompleted,
    totalTalkSeconds,
    avgCallDurationSeconds,
  });
}

export async function getPayoutSummary(req: Request, res: Response) {
  const partnerId = req.actor!.id;
  const date = typeof req.query.date === "string" ? req.query.date : todayDateString();
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const attendance = await Attendance.findOne({ partnerId, date });
  const giftBonusAgg = await PartnerTransaction.aggregate([
    {
      $match: {
        partnerId: new Types.ObjectId(partnerId),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    { $group: { _id: null, total: { $sum: "$amountDiamonds" } } },
  ]);
  const calls = await CallLog.find({
    partnerId,
    status: "completed",
    requestedAt: { $gte: startOfDay, $lte: endOfDay },
  }).select("durationSeconds");

  const callsCompleted = calls.length;
  const totalTalkSeconds = calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
  const avgCallDurationSeconds = callsCompleted ? Math.round(totalTalkSeconds / callsCompleted) : 0;
  const fixedPay = attendance?.fixedPayAmount ?? 0;
  const giftBonus = giftBonusAgg[0]?.total ?? 0;

  res.json({
    date,
    fixedPay,
    giftBonus,
    totalPayout: fixedPay + giftBonus,
    callsCompleted,
    totalTalkSeconds,
    avgCallDurationSeconds,
    settlementStatus: "to_be_paid_in_person",
  });
}

export async function listGiftHistory(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const transactions = await PartnerTransaction.find({ partnerId: req.actor!.id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ page, limit, transactions });
}
