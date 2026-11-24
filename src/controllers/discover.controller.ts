import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Partner } from "../models/Partner";
import { getOrCreateConversation, postMessage } from "../services/chat.service";
import { broadcastNewMessage } from "../sockets/chat.socket";
import { HttpError } from "../utils/HttpError";

const DEFAULT_GREETING = "Hey! Nice to meet you 😊";

function toAbsoluteUrl(baseUrl: string, path?: string): string | undefined {
  return path ? `${baseUrl}${path}` : undefined;
}

export async function listDiscoverFeed(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);

  const me = await User.findById(req.userId).select("favorites");
  const favorites = new Set((me?.favorites || []).map((id) => String(id)));

  const partners = await Partner.find({ verificationStatus: "approved" })
    .select("name age bio avatarUrl selfieImageUrl languages isOnline")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const fileBaseUrl = process.env.FILE_BASE_URL || "";

  res.json({
    page,
    limit,
    profiles: partners.map((p) => ({
      id: p._id,
      name: p.name,
      age: p.age,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      selfieImageUrl: toAbsoluteUrl(fileBaseUrl, p.selfieImageUrl),
      languages: p.languages,
      isOnline: p.isOnline,
      isFavorited: favorites.has(String(p._id)),
    })),
  });
}

export async function toggleFavorite(req: Request, res: Response) {
  const partnerId = String(req.params.partnerId);
  if (!Types.ObjectId.isValid(partnerId)) throw new HttpError(400, "Invalid partner id");

  const partner = await Partner.findById(partnerId);
  if (!partner) throw new HttpError(404, "Partner not found");

  const me = await User.findById(req.userId);
  if (!me) throw new HttpError(404, "User not found");

  const alreadyFavorited = me.favorites.some((id) => String(id) === partnerId);
  if (alreadyFavorited) {
    me.favorites = me.favorites.filter((id) => String(id) !== partnerId);
  } else {
    me.favorites.push(partner._id);
  }
  await me.save();

  res.json({ isFavorited: !alreadyFavorited });
}

export async function listFavorites(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);

  const me = await User.findById(req.userId).select("favorites");
  if (!me) throw new HttpError(404, "User not found");

  const total = me.favorites.length;
  const favoriteIds = [...me.favorites].reverse().slice((page - 1) * limit, page * limit);

  const partners = await Partner.find({ _id: { $in: favoriteIds } }).select(
    "name age bio selfieImageUrl languages isOnline"
  );
  const partnerById = new Map(partners.map((p) => [String(p._id), p]));
  const fileBaseUrl = process.env.FILE_BASE_URL || "";

  res.json({
    page,
    limit,
    total,
    profiles: favoriteIds
      .map((id) => partnerById.get(String(id)))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({
        id: p._id,
        name: p.name,
        age: p.age,
        bio: p.bio,
        selfieImageUrl: toAbsoluteUrl(fileBaseUrl, p.selfieImageUrl),
        languages: p.languages,
        isOnline: p.isOnline,
        isFavorited: true,
      })),
  });
}

export async function sayHello(req: Request, res: Response) {
  const partnerId = String(req.params.partnerId);
  if (!Types.ObjectId.isValid(partnerId)) throw new HttpError(400, "Invalid partner id");

  const me = await User.findById(req.userId).select("isGuest");
  if (!me) throw new HttpError(404, "User not found");
  if (me.isGuest) throw new HttpError(403, "Please log in to say hello");

  const partner = await Partner.findById(partnerId);
  if (!partner) throw new HttpError(404, "Partner not found");

  const conversation = await getOrCreateConversation(req.userId!, partnerId);
  const text = (req.body?.message as string | undefined)?.trim() || DEFAULT_GREETING;

  const { message } = await postMessage(String(conversation._id), { id: req.userId!, role: "user" }, text);

  broadcastNewMessage(req.userId!, partnerId, String(conversation._id), message);

  res.status(201).json({ conversationId: conversation._id, message });
}
