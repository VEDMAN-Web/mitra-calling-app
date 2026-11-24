import { Request, Response } from "express";
import { User, IUser } from "../models/User";
import { HttpError } from "../utils/HttpError";
import { uploadedUserFileUrl, deleteUserImage } from "../config/upload";

function toClientUser(user: IUser) {
  const fileBaseUrl = process.env.FILE_BASE_URL || "";
  return { ...user.toObject(), imageUrl: user.imageUrl ? `${fileBaseUrl}${user.imageUrl}` : user.imageUrl };
}

export async function getMe(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user: toClientUser(user), totalFavorites: user.favorites.length });
}

export async function updateMe(req: Request, res: Response) {
  const existing = await User.findById(req.userId).select("imageUrl");
  if (!existing) throw new HttpError(404, "User not found");

  const { name, age, bio, avatarUrl } = req.body as {
    name?: string;
    age?: number | string;
    bio?: string;
    avatarUrl?: string;
  };

  const parsedAge = age !== undefined ? Number(age) : undefined;
  if (parsedAge !== undefined && parsedAge < 18) {
    throw new HttpError(400, "age must be 18 or older");
  }

  const imageFile = req.file;
  const imageUrl = imageFile ? uploadedUserFileUrl(imageFile.filename) : undefined;

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $set: {
        ...(name && { name }),
        ...(parsedAge !== undefined && { age: parsedAge }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    },
    { new: true }
  );
  if (!user) throw new HttpError(404, "User not found");

  if (imageUrl && existing.imageUrl) {
    await deleteUserImage(existing.imageUrl);
  }

  res.json({ user: toClientUser(user) });
}

export async function getUserById(req: Request, res: Response) {
  const user = await User.findById(req.params.id).select("name age bio avatarUrl imageUrl createdAt");
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user: toClientUser(user) });
}
