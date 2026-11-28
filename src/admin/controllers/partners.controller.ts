import { Request, Response } from "express";
import fs from "fs";
import { Types } from "mongoose";
import { Partner } from "../../models/Partner";
import { HttpError } from "../../common/utils/HttpError";
import { uploadedFileUrl, deletePartnerFile } from "../../config/upload";
import { uploadPreviewVideo as uploadVideoToDrive, deleteDriveFile, extractDriveFileId } from "../../common/utils/googleDrive";

type MulterFiles = { [field: string]: Express.Multer.File[] };

function pickFiles(req: Request) {
  const files = req.files as MulterFiles | undefined;
  const assetFiles = files?.assets;
  const videoFiles = files?.videos;
  if (assetFiles && assetFiles.length > 5) throw new HttpError(400, "assets can have at most 5 images");
  if (videoFiles && videoFiles.length > 3) throw new HttpError(400, "videos can have at most 3 videos");
  return {
    avatarFile: files?.avatar?.[0],
    assetFiles,
    previewVideoFile: files?.previewVideo?.[0],
    videoFiles,
  };
}

async function uploadToDriveAndCleanup(file: Express.Multer.File, partnerId: string): Promise<string> {
  try {
    return await uploadVideoToDrive(file.path, file.originalname, file.mimetype, partnerId);
  } finally {
    await fs.promises.unlink(file.path).catch(() => {});
  }
}

async function deleteDriveUrl(url?: string): Promise<void> {
  const fileId = url ? extractDriveFileId(url) : null;
  if (fileId) await deleteDriveFile(fileId).catch(() => {});
}

export async function listPendingPartners(_req: Request, res: Response) {
  const partners = await Partner.find({ verificationStatus: "in_review" }).sort({ createdAt: 1 });
  res.json({ partners });
}

export async function listPartners(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const { search, verificationStatus, isOnline, isVip } = req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = {};
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
  }
  if (verificationStatus) filter.verificationStatus = verificationStatus;
  if (isOnline === "true") filter.isOnline = true;
  else if (isOnline === "false") filter.isOnline = false;
  if (isVip === "true") filter.isVip = true;
  else if (isVip === "false") filter.isVip = false;

  const [partners, total] = await Promise.all([
    Partner.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Partner.countDocuments(filter),
  ]);

  res.json({ page, limit, total, partners });
}

export async function getPartner(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid partner id");

  const partner = await Partner.findById(id);
  if (!partner) throw new HttpError(404, "Partner not found");

  res.json({ partner });
}

export async function createPartner(req: Request, res: Response) {
  const { name, phone, email, age, languages, bio, isVip } = req.body as {
    name?: string;
    phone?: string;
    email?: string;
    age?: string | number;
    languages?: string[];
    bio?: string;
    isVip?: string | boolean;
  };
  if (!name) throw new HttpError(400, "name is required");

  const { avatarFile, assetFiles, previewVideoFile, videoFiles } = pickFiles(req);
  const avatarUrl = avatarFile ? uploadedFileUrl(avatarFile.filename) : undefined;
  const assets = assetFiles?.length ? assetFiles.map((f) => uploadedFileUrl(f.filename)) : undefined;

  let partner;
  try {
    partner = await Partner.create({
      isGuest: false,
      name,
      phone,
      email: email ? email.toLowerCase() : undefined,
      age: age !== undefined ? Number(age) : undefined,
      languages,
      bio,
      avatarUrl,
      assets,
      isVip: isVip === true || isVip === "true",
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new HttpError(409, "Phone or email already in use");
    }
    throw err;
  }

  if (previewVideoFile || videoFiles?.length) {
    const partnerId = String(partner._id);
    const previewUrl = previewVideoFile ? await uploadToDriveAndCleanup(previewVideoFile, partnerId) : undefined;
    const videos = videoFiles?.length ? await Promise.all(videoFiles.map((f) => uploadToDriveAndCleanup(f, partnerId))) : undefined;

    partner = await Partner.findByIdAndUpdate(
      partner._id,
      { $set: { ...(previewUrl !== undefined && { previewUrl }), ...(videos !== undefined && { videos }) } },
      { new: true }
    );
  }

  res.status(201).json({ partner });
}

export async function updatePartner(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid partner id");

  const existing = await Partner.findById(id).select("avatarUrl assets previewUrl videos");
  if (!existing) throw new HttpError(404, "Partner not found");

  const { name, phone, email, age, languages, bio, isVip, isOnline } = req.body as {
    name?: string;
    phone?: string;
    email?: string;
    age?: string | number;
    languages?: string[];
    bio?: string;
    isVip?: string | boolean;
    isOnline?: string | boolean;
  };

  const { avatarFile, assetFiles, previewVideoFile, videoFiles } = pickFiles(req);
  const avatarUrl = avatarFile ? uploadedFileUrl(avatarFile.filename) : undefined;
  const assets = assetFiles?.length ? assetFiles.map((f) => uploadedFileUrl(f.filename)) : undefined;
  const previewUrl = previewVideoFile ? await uploadToDriveAndCleanup(previewVideoFile, id) : undefined;
  const videos = videoFiles?.length ? await Promise.all(videoFiles.map((f) => uploadToDriveAndCleanup(f, id))) : undefined;
  const normalizedEmail = email ? email.toLowerCase() : undefined;

  let partner;
  try {
    partner = await Partner.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(normalizedEmail !== undefined && { email: normalizedEmail }),
          ...(age !== undefined && { age: Number(age) }),
          ...(languages !== undefined && { languages }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(assets !== undefined && { assets }),
          ...(previewUrl !== undefined && { previewUrl }),
          ...(videos !== undefined && { videos }),
          ...(isVip !== undefined && { isVip: isVip === true || isVip === "true" }),
          ...(isOnline !== undefined && { isOnline: isOnline === true || isOnline === "true" }),
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
  if (!partner) throw new HttpError(404, "Partner not found");

  if (avatarFile && existing.avatarUrl) await deletePartnerFile(existing.avatarUrl);
  if (assets && existing.assets?.length) await Promise.all(existing.assets.map((url) => deletePartnerFile(url)));
  if (previewUrl !== undefined && existing.previewUrl) await deleteDriveUrl(existing.previewUrl);
  if (videos !== undefined && existing.videos?.length) await Promise.all(existing.videos.map((url) => deleteDriveUrl(url)));

  res.json({ partner });
}

export async function deletePartner(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid partner id");

  const partner = await Partner.findByIdAndDelete(id);
  if (!partner) throw new HttpError(404, "Partner not found");

  if (partner.avatarUrl) await deletePartnerFile(partner.avatarUrl);
  if (partner.assets?.length) await Promise.all(partner.assets.map((url) => deletePartnerFile(url)));
  if (partner.previewUrl) await deleteDriveUrl(partner.previewUrl);
  if (partner.videos?.length) await Promise.all(partner.videos.map((url) => deleteDriveUrl(url)));

  res.json({ success: true });
}

export async function approvePartner(req: Request, res: Response) {
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new HttpError(404, "Partner not found");

  partner.verificationStatus = "approved";
  partner.rejectionReason = undefined;
  await partner.save();

  res.json({ partner });
}

export async function rejectPartner(req: Request, res: Response) {
  const { reason } = req.body as { reason?: string };
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new HttpError(404, "Partner not found");

  partner.verificationStatus = "rejected";
  partner.rejectionReason = reason || "Not specified";
  await partner.save();

  res.json({ partner });
}
