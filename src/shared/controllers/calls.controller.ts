import { Request, Response } from "express";
import { CallLog } from "../models/CallLog";

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
