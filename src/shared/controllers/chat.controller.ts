import { Request, Response } from "express";
import { Types } from "mongoose";
import { Conversation } from "../../models/Conversation";
import { Message } from "../../models/Message";
import { User } from "../../models/User";
import { Partner } from "../../models/Partner";
import { HttpError } from "../../common/utils/HttpError";
import { assertParticipant, getOrCreateConversation, postCallLogMessage } from "../services/chat.service";

export async function listConversations(req: Request, res: Response) {
  const actor = req.actor!;
  const filter = actor.role === "user" ? { userId: actor.id } : { partnerId: actor.id };

  const conversations = await Conversation.find(filter).sort({
    "lastMessage.createdAt": -1,
    createdAt: -1,
  });

  const otherIds = conversations.map((c) => (actor.role === "user" ? c.partnerId : c.userId));
  const otherById = new Map<string, { _id: unknown; name: string; avatarUrl?: string }>();
  if (actor.role === "user") {
    const partners = await Partner.find({ _id: { $in: otherIds } }).select("name avatarUrl");
    partners.forEach((p) => otherById.set(String(p._id), p));
  } else {
    const users = await User.find({ _id: { $in: otherIds } }).select("name avatarUrl");
    users.forEach((u) => otherById.set(String(u._id), u));
  }

  const results = await Promise.all(
    conversations.map(async (c) => {
      const otherId = actor.role === "user" ? c.partnerId : c.userId;
      const other = otherById.get(String(otherId));
      const lastReadAt = actor.role === "user" ? c.userLastReadAt : c.partnerLastReadAt;
      const unreadCount = await Message.countDocuments({
        conversationId: c._id,
        senderRole: actor.role === "user" ? "partner" : "user",
        createdAt: { $gt: lastReadAt },
      });

      return {
        id: c._id,
        other: other ? { id: other._id, name: other.name, avatarUrl: other.avatarUrl } : null,
        lastMessage: c.lastMessage || null,
        unreadCount,
      };
    })
  );

  res.json({ conversations: results });
}

export async function getMessages(req: Request, res: Response) {
  const actor = req.actor! as { id: string; role: "user" | "partner" };
  const conversation = await assertParticipant(String(req.params.conversationId), actor);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 30);

  const messages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  if (actor.role === "user") conversation.userLastReadAt = new Date();
  else conversation.partnerLastReadAt = new Date();
  await conversation.save();

  res.json({ page, limit, messages: messages.reverse() });
}

export async function logCall(req: Request, res: Response) {
  const actor = req.actor! as { id: string; role: "user" | "partner" };
  const partnerId = String(req.params.partnerId);
  if (!Types.ObjectId.isValid(partnerId)) throw new HttpError(400, "Invalid partner id");

  const { status, durationSeconds } = req.body as { status?: string; durationSeconds?: number };
  if (status !== "answer" && status !== "reject") {
    throw new HttpError(400, "status must be 'answer' or 'reject'");
  }
  if (status === "answer" && !(Number(durationSeconds) >= 0)) {
    throw new HttpError(400, "durationSeconds is required when status is 'answer'");
  }

  const partner = await Partner.findById(partnerId);
  if (!partner) throw new HttpError(404, "Partner not found");

  const conversation = await getOrCreateConversation(actor.id, partnerId);
  const { message } = await postCallLogMessage(
    String(conversation._id),
    actor,
    status === "answer" ? "answered" : "declined",
    status === "answer" ? Number(durationSeconds) : undefined
  );

  res.status(201).json({ conversationId: conversation._id, message });
}
