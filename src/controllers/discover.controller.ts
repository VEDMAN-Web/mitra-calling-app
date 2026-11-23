import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { HttpError } from "../utils/HttpError";

const DEFAULT_GREETING = "Hey! Nice to meet you 😊";

export async function listDiscoverFeed(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);

  const me = await User.findById(req.userId).select("favorites");
  const favorites = new Set((me?.favorites || []).map((id) => String(id)));

  const users = await User.find({ _id: { $ne: req.userId } })
    .select("name age bio avatarUrl")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    page,
    limit,
    profiles: users.map((u) => ({
      id: u._id,
      name: u.name,
      age: u.age,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      isFavorited: favorites.has(String(u._id)),
    })),
  });
}

export async function toggleFavorite(req: Request, res: Response) {
  const targetId = String(req.params.userId);
  if (!Types.ObjectId.isValid(targetId)) throw new HttpError(400, "Invalid user id");
  if (targetId === req.userId) throw new HttpError(400, "Cannot favorite yourself");

  const target = await User.findById(targetId);
  if (!target) throw new HttpError(404, "User not found");

  const me = await User.findById(req.userId);
  if (!me) throw new HttpError(404, "User not found");

  const alreadyFavorited = me.favorites.some((id) => String(id) === targetId);
  if (alreadyFavorited) {
    me.favorites = me.favorites.filter((id) => String(id) !== targetId);
  } else {
    me.favorites.push(target._id);
  }
  await me.save();

  res.json({ isFavorited: !alreadyFavorited });
}

export async function sayHello(req: Request, res: Response) {
  const targetId = String(req.params.userId);
  if (!Types.ObjectId.isValid(targetId)) throw new HttpError(400, "Invalid user id");
  if (targetId === req.userId) throw new HttpError(400, "Cannot say hello to yourself");

  const target = await User.findById(targetId);
  if (!target) throw new HttpError(404, "User not found");

  const meId = new Types.ObjectId(req.userId);
  const targetObjectId = new Types.ObjectId(targetId);

  let conversation = await Conversation.findOne({
    participants: { $all: [meId, targetObjectId], $size: 2 },
  });

  const text = (req.body?.message as string | undefined)?.trim() || DEFAULT_GREETING;

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [meId, targetObjectId],
    });
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: meId,
    text,
  });

  conversation.lastMessage = { text, senderId: meId, createdAt: message.createdAt };
  await conversation.save();

  res.status(201).json({ conversationId: conversation._id, message });
}
