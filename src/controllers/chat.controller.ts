import { Request, Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { Partner } from "../models/Partner";
import { assertParticipant, postMessage } from "../services/chat.service";
import { broadcastNewMessage } from "../sockets/chat.socket";
import { HttpError } from "../utils/HttpError";

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
  const actor = req.actor!;
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

export async function sendMessage(req: Request, res: Response) {
  const actor = req.actor!;
  const { text } = req.body as { text?: string };
  if (!text) throw new HttpError(400, "text is required");

  const { conversation, message } = await postMessage(String(req.params.conversationId), actor, text);

  broadcastNewMessage(String(conversation.userId), String(conversation.partnerId), String(conversation._id), message);

  res.status(201).json({ message });
}
