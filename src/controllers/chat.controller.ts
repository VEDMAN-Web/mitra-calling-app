import { Request, Response } from "express";
import { Types } from "mongoose";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { HttpError } from "../utils/HttpError";

async function assertParticipant(conversationId: string, userId: string) {
  if (!Types.ObjectId.isValid(conversationId)) throw new HttpError(400, "Invalid conversation id");
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new HttpError(404, "Conversation not found");
  if (!conversation.participants.some((id) => String(id) === userId)) {
    throw new HttpError(403, "Not a participant of this conversation");
  }
  return conversation;
}

export async function listConversations(req: Request, res: Response) {
  const conversations = await Conversation.find({ participants: req.userId }).sort({
    "lastMessage.createdAt": -1,
    createdAt: -1,
  });

  const otherUserIds = conversations.map(
    (c) => c.participants.find((id) => String(id) !== req.userId)!
  );
  const otherUsers = await User.find({ _id: { $in: otherUserIds } }).select("name avatarUrl");
  const otherUserById = new Map(otherUsers.map((u) => [String(u._id), u]));

  const results = await Promise.all(
    conversations.map(async (c) => {
      const otherUser = otherUserById.get(String(c.participants.find((id) => String(id) !== req.userId)));
      const lastReadAt = c.lastReadAt?.get(req.userId!) || new Date(0);
      const unreadCount = await Message.countDocuments({
        conversationId: c._id,
        senderId: { $ne: req.userId },
        createdAt: { $gt: lastReadAt },
      });

      return {
        id: c._id,
        otherUser: otherUser ? { id: otherUser._id, name: otherUser.name, avatarUrl: otherUser.avatarUrl } : null,
        lastMessage: c.lastMessage || null,
        unreadCount,
      };
    })
  );

  res.json({ conversations: results });
}

export async function getMessages(req: Request, res: Response) {
  const conversation = await assertParticipant(String(req.params.conversationId), req.userId!);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 30);

  const messages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  conversation.lastReadAt.set(req.userId!, new Date());
  await conversation.save();

  res.json({ page, limit, messages: messages.reverse() });
}

export async function sendMessage(req: Request, res: Response) {
  const conversation = await assertParticipant(String(req.params.conversationId), req.userId!);

  const { text } = req.body as { text?: string };
  if (!text || !text.trim()) throw new HttpError(400, "text is required");

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.userId,
    text: text.trim(),
  });

  conversation.lastMessage = { text: message.text, senderId: message.senderId, createdAt: message.createdAt };
  await conversation.save();

  res.status(201).json({ message });
}
