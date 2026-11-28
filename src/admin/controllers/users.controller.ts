import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../../models/User";
import { HttpError } from "../../common/utils/HttpError";
import { uploadedUserFileUrl, deleteUserImage } from "../../config/upload";

export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const { search } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = {};
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ page, limit, total, users });
}

export async function getUser(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid user id");

  const user = await User.findById(id);
  if (!user) throw new HttpError(404, "User not found");

  res.json({ user });
}

export async function createUser(req: Request, res: Response) {
  const { name, phone, email, age, bio, diamondBalance } = req.body as {
    name?: string;
    phone?: string;
    email?: string;
    age?: string | number;
    bio?: string;
    diamondBalance?: string | number;
  };
  if (!name) throw new HttpError(400, "name is required");

  const imageFile = req.file;
  const imageUrl = imageFile ? uploadedUserFileUrl(imageFile.filename) : undefined;

  let user;
  try {
    user = await User.create({
      isGuest: false,
      name,
      phone,
      email: email ? email.toLowerCase() : undefined,
      age: age !== undefined ? Number(age) : undefined,
      bio,
      imageUrl,
      ...(diamondBalance !== undefined && { diamondBalance: Number(diamondBalance) }),
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new HttpError(409, "Phone or email already in use");
    }
    throw err;
  }

  res.status(201).json({ user });
}

export async function updateUser(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid user id");

  const existing = await User.findById(id).select("imageUrl");
  if (!existing) throw new HttpError(404, "User not found");

  const { name, phone, email, age, bio, diamondBalance } = req.body as {
    name?: string;
    phone?: string;
    email?: string;
    age?: string | number;
    bio?: string;
    diamondBalance?: string | number;
  };

  const imageFile = req.file;
  const imageUrl = imageFile ? uploadedUserFileUrl(imageFile.filename) : undefined;
  const normalizedEmail = email ? email.toLowerCase() : undefined;

  let user;
  try {
    user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(normalizedEmail !== undefined && { email: normalizedEmail }),
          ...(age !== undefined && { age: Number(age) }),
          ...(bio !== undefined && { bio }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(diamondBalance !== undefined && { diamondBalance: Number(diamondBalance) }),
        },
      },
      { new: true }
    );
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new HttpError(409, "Phone or email already in use");
    }
    throw err;
  }
  if (!user) throw new HttpError(404, "User not found");

  if (imageFile && existing.imageUrl) {
    await deleteUserImage(existing.imageUrl);
  }

  res.json({ user });
}

export async function deleteUser(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid user id");

  const user = await User.findByIdAndDelete(id);
  if (!user) throw new HttpError(404, "User not found");

  if (user.imageUrl) {
    await deleteUserImage(user.imageUrl);
  }

  res.json({ success: true });
}
