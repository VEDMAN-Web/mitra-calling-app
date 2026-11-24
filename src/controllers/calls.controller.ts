import { Request, Response } from "express";
import { Types } from "mongoose";
import { CallLog } from "../models/CallLog";
import { User } from "../models/User";
import { Partner } from "../models/Partner";
import { Transaction } from "../models/Transaction";
import { COINS_PER_MINUTE_CALL } from "../config/coinPackages";
import { HttpError } from "../utils/HttpError";
import { emitToPartner, emitToUser } from "../sockets/chat.socket";

export async function startCall(req: Request, res: Response) {
  const { partnerId, type } = req.body as { partnerId?: string; type?: "video" | "voice" };
  if (!partnerId || !Types.ObjectId.isValid(partnerId)) throw new HttpError(400, "Valid partnerId is required");
  if (type !== "video" && type !== "voice") throw new HttpError(400, "type must be 'video' or 'voice'");

  const partner = await Partner.findById(partnerId);
  if (!partner) throw new HttpError(404, "Partner not found");

  const caller = await User.findById(req.userId);
  if (!caller) throw new HttpError(404, "User not found");
  if (caller.coinBalance < COINS_PER_MINUTE_CALL) {
    throw new HttpError(402, "Insufficient coin balance to start a call");
  }

  const call = await CallLog.create({
    callerId: caller._id,
    partnerId: partner._id,
    type,
    status: "pending",
    requestedAt: new Date(),
  });

  emitToPartner(String(partner._id), "call:incoming", {
    callId: call._id,
    type,
    caller: { id: caller._id, name: caller.name, avatarUrl: caller.avatarUrl },
  });

  res.status(201).json({ call });
}

export async function respondToCall(req: Request, res: Response) {
  const call = await CallLog.findById(req.params.callId);
  if (!call) throw new HttpError(404, "Call not found");
  if (String(call.partnerId) !== req.actor!.id) throw new HttpError(403, "Not the callee of this call");
  if (call.status !== "pending") throw new HttpError(400, "Call is not pending");

  const { accept } = req.body as { accept?: boolean };

  if (accept) {
    call.status = "ongoing";
    call.acceptedAt = new Date();
    await call.save();
    emitToUser(String(call.callerId), "call:accepted", { callId: call._id });
  } else {
    call.status = "declined";
    await call.save();
    emitToUser(String(call.callerId), "call:declined", { callId: call._id });
  }

  res.json({ call });
}

export async function endCall(req: Request, res: Response) {
  const call = await CallLog.findById(req.params.callId);
  if (!call) throw new HttpError(404, "Call not found");

  const actor = req.actor!;
  const isCaller = actor.role === "user" && String(call.callerId) === actor.id;
  const isPartner = actor.role === "partner" && String(call.partnerId) === actor.id;
  if (!isCaller && !isPartner) throw new HttpError(403, "Not a participant of this call");

  if (call.status === "completed" || call.status === "declined") {
    throw new HttpError(400, "Call has already ended");
  }

  if (call.status === "pending") {
    call.status = "declined";
    call.endedAt = new Date();
    await call.save();
    emitToPartner(String(call.partnerId), "call:ended", { callId: call._id });
    emitToUser(String(call.callerId), "call:ended", { callId: call._id });
    res.json({ call });
    return;
  }

  const caller = await User.findById(call.callerId);
  if (!caller) throw new HttpError(404, "User not found");

  const endedAt = new Date();
  const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - call.acceptedAt!.getTime()) / 1000));
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

  emitToPartner(String(call.partnerId), "call:ended", { callId: call._id, durationSeconds });
  emitToUser(String(call.callerId), "call:ended", { callId: call._id, durationSeconds });

  res.json({ call, coinBalance: caller.coinBalance });
}

export async function listCallHistory(req: Request, res: Response) {
  const actor = req.actor!;
  const filter = actor.role === "user" ? { callerId: actor.id } : { partnerId: actor.id };

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const calls = await CallLog.find(filter)
    .sort({ requestedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ page, limit, calls });
}
