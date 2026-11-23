import { Request, Response } from "express";
import { Types } from "mongoose";
import { CallLog } from "../models/CallLog";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";
import { COINS_PER_MINUTE_CALL } from "../config/coinPackages";
import { HttpError } from "../utils/HttpError";

export async function startCall(req: Request, res: Response) {
  const { calleeId, type } = req.body as { calleeId?: string; type?: "video" | "voice" };
  if (!calleeId || !Types.ObjectId.isValid(calleeId)) throw new HttpError(400, "Valid calleeId is required");
  if (calleeId === req.userId) throw new HttpError(400, "Cannot call yourself");
  if (type !== "video" && type !== "voice") throw new HttpError(400, "type must be 'video' or 'voice'");

  const callee = await User.findById(calleeId);
  if (!callee) throw new HttpError(404, "Callee not found");

  const caller = await User.findById(req.userId);
  if (!caller) throw new HttpError(404, "User not found");
  if (caller.coinBalance < COINS_PER_MINUTE_CALL) {
    throw new HttpError(402, "Insufficient coin balance to start a call");
  }

  const call = await CallLog.create({
    callerId: caller._id,
    calleeId: callee._id,
    type,
    status: "ongoing",
    startedAt: new Date(),
  });

  res.status(201).json({ call });
}

export async function endCall(req: Request, res: Response) {
  const call = await CallLog.findById(req.params.callId);
  if (!call) throw new HttpError(404, "Call not found");
  if (String(call.callerId) !== req.userId) throw new HttpError(403, "Not the caller of this call");
  if (call.status === "completed") throw new HttpError(400, "Call already ended");

  const caller = await User.findById(call.callerId);
  if (!caller) throw new HttpError(404, "User not found");

  const endedAt = new Date();
  const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - call.startedAt.getTime()) / 1000));
  const minutesBilled = Math.ceil(durationSeconds / 60);
  const fullCost = minutesBilled * COINS_PER_MINUTE_CALL;
  const coinsCharged = Math.min(fullCost, caller.coinBalance);

  caller.coinBalance -= coinsCharged;
  await caller.save();

  await Transaction.create({
    userId: caller._id,
    type: "call_deduction",
    amount: -coinsCharged,
    balanceAfter: caller.coinBalance,
    meta: { callId: call._id, type: call.type, durationSeconds },
  });

  call.status = "completed";
  call.endedAt = endedAt;
  call.durationSeconds = durationSeconds;
  call.coinsCharged = coinsCharged;
  await call.save();

  res.json({ call, coinBalance: caller.coinBalance });
}

export async function listCallHistory(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const calls = await CallLog.find({
    $or: [{ callerId: req.userId }, { calleeId: req.userId }],
  })
    .sort({ startedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ page, limit, calls });
}
