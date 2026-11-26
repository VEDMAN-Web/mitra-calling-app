import { Request, Response } from "express";
import fs from "fs";
import { Partner, IdDocumentType } from "../../models/Partner";
import { HttpError } from "../../common/utils/HttpError";
import { uploadedFileUrl, deletePartnerFile } from "../../config/upload";
import { uploadPreviewVideo as uploadPreviewVideoToDrive, deleteDriveFile, extractDriveFileId } from "../../common/utils/googleDrive";

export async function getMe(req: Request, res: Response) {
  const partner = await Partner.findById(req.actor!.id);
  if (!partner) throw new HttpError(404, "Partner not found");
  res.json({ partner });
}

export async function updateMe(req: Request, res: Response) {
  const existing = await Partner.findById(req.actor!.id).select("avatarUrl");
  if (!existing) throw new HttpError(404, "Partner not found");

  const { name, languages, bio, avatarUrl: avatarUrlField, phone, email } = req.body as {
    name?: string;
    languages?: string[];
    bio?: string;
    avatarUrl?: string;
    phone?: string;
    email?: string;
  };

  const avatarFile = req.file;
  const avatarUrl = avatarFile ? uploadedFileUrl(avatarFile.filename) : avatarUrlField;

  const normalizedEmail = email ? email.toLowerCase() : undefined;
  const becomesReal = phone !== undefined || normalizedEmail !== undefined;

  let partner;
  try {
    partner = await Partner.findByIdAndUpdate(
      req.actor!.id,
      {
        $set: {
          ...(name && { name }),
          ...(languages && { languages }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(phone !== undefined && { phone }),
          ...(normalizedEmail !== undefined && { email: normalizedEmail }),
          ...(becomesReal && { isGuest: false }),
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

  if (avatarFile && existing.avatarUrl) {
    await deletePartnerFile(existing.avatarUrl);
  }

  res.json({ partner });
}

export async function uploadPreviewVideo(req: Request, res: Response) {
  const file = req.file;
  if (!file) throw new HttpError(400, "previewVideo file is required");

  const partner = await Partner.findById(req.actor!.id).select("previewUrl");
  if (!partner) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new HttpError(404, "Partner not found");
  }

  let previewUrl: string;
  try {
    previewUrl = await uploadPreviewVideoToDrive(file.path, file.originalname, file.mimetype, String(partner._id));
  } finally {
    await fs.promises.unlink(file.path).catch(() => {});
  }

  const oldFileId = partner.previewUrl ? extractDriveFileId(partner.previewUrl) : null;

  partner.previewUrl = previewUrl;
  await partner.save();

  if (oldFileId) {
    await deleteDriveFile(oldFileId).catch(() => {});
  }

  res.status(201).json({ partner });
}

export async function addVideo(req: Request, res: Response) {
  const file = req.file;
  if (!file) throw new HttpError(400, "video file is required");

  const partner = await Partner.findById(req.actor!.id).select("videos");
  if (!partner) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new HttpError(404, "Partner not found");
  }

  if ((partner.videos?.length ?? 0) >= 3) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new HttpError(409, "Already have the maximum of 3 videos");
  }

  let videoUrl: string;
  try {
    videoUrl = await uploadPreviewVideoToDrive(file.path, file.originalname, file.mimetype, String(partner._id));
  } finally {
    await fs.promises.unlink(file.path).catch(() => {});
  }

  partner.videos = [...(partner.videos ?? []), videoUrl];
  await partner.save();

  res.status(201).json({ partner });
}

export async function submitVerification(req: Request, res: Response) {
  const { idType, age, name } = req.body as { idType?: IdDocumentType; age?: string | number; name?: string };
  const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
  const idImage = files?.idImage?.[0];
  const selfieImage = files?.selfieImage?.[0];

  if (!idType) throw new HttpError(400, "idType is required");
  if (!idImage || !selfieImage) throw new HttpError(400, "idImage and selfieImage files are required");

  const partner = await Partner.findById(req.actor!.id);
  if (!partner) throw new HttpError(404, "Partner not found");

  partner.idDocument = { type: idType, imageUrl: uploadedFileUrl(idImage.filename) };
  partner.selfieImageUrl = uploadedFileUrl(selfieImage.filename);
  // Admin review is skipped for now - every partner is auto-approved right after submitting verification.
  partner.verificationStatus = "approved";
  partner.rejectionReason = undefined;
  if (age !== undefined) partner.age = Number(age);
  if (name) partner.name = name;
  await partner.save();

  res.status(201).json({ partner });
}
