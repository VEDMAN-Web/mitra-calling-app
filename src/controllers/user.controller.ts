import { Request, Response } from "express";
import { User } from "../models/User";
import { HttpError } from "../utils/HttpError";

export async function getMe(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user });
}

export async function updateMe(req: Request, res: Response) {
  const { name, age, bio, avatarUrl } = req.body as {
    name?: string;
    age?: number;
    bio?: string;
    avatarUrl?: string;
  };

  if (age !== undefined && age < 18) {
    throw new HttpError(400, "age must be 18 or older");
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { ...(name && { name }), ...(age !== undefined && { age }), ...(bio !== undefined && { bio }), ...(avatarUrl !== undefined && { avatarUrl }) } },
    { new: true }
  );
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user });
}

export async function getUserById(req: Request, res: Response) {
  const user = await User.findById(req.params.id).select("name age bio avatarUrl createdAt");
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user });
}
