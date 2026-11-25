import { Server, Socket } from "socket.io";
import { Types } from "mongoose";
import { CallLog } from "../models/CallLog";
import { User } from "../models/User";
import { Partner } from "../models/Partner";
import { Transaction } from "../models/Transaction";
import { COINS_PER_MINUTE_CALL } from "../config/coinPackages";
import { HttpError } from "../utils/HttpError";
import { ActorRole } from "../utils/jwt";
import { generateAgoraToken, uidFromId } from "../utils/agora";
import { room } from "./rooms";

type Actor = { id: string; role: ActorRole };
type Ack = (response: Record<string, unknown>) => void;

export function registerCallHandlers(io: Server, socket: Socket, actor: Actor) {
  socket.on("call:start", async (payload: { partnerId?: string }, ack?: Ack) => {
    try {
      if (actor.role !== "user") throw new HttpError(403, "Only users can start calls");

      const { partnerId } = payload || {};
      if (!partnerId || !Types.ObjectId.isValid(partnerId)) throw new HttpError(400, "Valid partnerId is required");

      const partner = await Partner.findById(partnerId);
      if (!partner) throw new HttpError(404, "Partner not found");

      const caller = await User.findById(actor.id);
      if (!caller) throw new HttpError(404, "User not found");
      if (caller.coinBalance < COINS_PER_MINUTE_CALL) {
        throw new HttpError(402, "Insufficient coin balance to start a call");
      }

      const call = await CallLog.create({
        callerId: caller._id,
        partnerId: partner._id,
        type: "video",
        status: "pending",
        requestedAt: new Date(),
      });

      const channel = String(call._id);
      const callerToken = generateAgoraToken(channel, uidFromId(String(caller._id)));

      io.to(room("partner", String(partner._id))).emit("call:incoming", {
        callId: call._id,
        channel,
        caller: { id: caller._id, name: caller.name, avatarUrl: caller.avatarUrl },
      });

      ack?.({ call, channel, token: callerToken });
    } catch (err) {
      ack?.({ error: err instanceof HttpError ? err.message : "Failed to start call" });
    }
  });

  socket.on("call:respond", async (payload: { callId?: string; accept?: boolean }, ack?: Ack) => {
    try {
      if (actor.role !== "partner") throw new HttpError(403, "Only partners can respond to calls");

      const { callId, accept } = payload || {};
      if (!callId || !Types.ObjectId.isValid(callId)) throw new HttpError(400, "Valid callId is required");

      const call = await CallLog.findById(callId);
      if (!call) throw new HttpError(404, "Call not found");
      if (String(call.partnerId) !== actor.id) throw new HttpError(403, "Not the callee of this call");
      if (call.status !== "pending") throw new HttpError(400, "Call is not pending");

      if (accept) {
        call.status = "ongoing";
        call.acceptedAt = new Date();
        await call.save();

        const channel = String(call._id);
        const partnerToken = generateAgoraToken(channel, uidFromId(actor.id));

        io.to(room("user", String(call.callerId))).emit("call:accepted", { callId: call._id, channel });
        ack?.({ call, channel, token: partnerToken });
      } else {
        call.status = "declined";
        await call.save();
        io.to(room("user", String(call.callerId))).emit("call:declined", { callId: call._id });
        ack?.({ call });
      }
    } catch (err) {
      ack?.({ error: err instanceof HttpError ? err.message : "Failed to respond to call" });
    }
  });

  socket.on("call:end", async (payload: { callId?: string }, ack?: Ack) => {
    try {
      const { callId } = payload || {};
      if (!callId || !Types.ObjectId.isValid(callId)) throw new HttpError(400, "Valid callId is required");

      const call = await CallLog.findById(callId);
      if (!call) throw new HttpError(404, "Call not found");

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
        io.to(room("partner", String(call.partnerId))).emit("call:ended", { callId: call._id });
        io.to(room("user", String(call.callerId))).emit("call:ended", { callId: call._id });
        ack?.({ call });
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

      io.to(room("partner", String(call.partnerId))).emit("call:ended", { callId: call._id, durationSeconds });
      io.to(room("user", String(call.callerId))).emit("call:ended", { callId: call._id, durationSeconds });

      ack?.({ call, coinBalance: caller.coinBalance });
    } catch (err) {
      ack?.({ error: err instanceof HttpError ? err.message : "Failed to end call" });
    }
  });
}
