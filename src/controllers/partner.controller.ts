import { Request, Response } from "express";
import fs from "fs";
import { Types } from "mongoose";
import { Partner, IdDocumentType } from "../models/Partner";
import { Attendance } from "../models/Attendance";
import { CallLog } from "../models/CallLog";
import { PartnerTransaction } from "../models/PartnerTransaction";
import { signToken } from "../utils/jwt";
import { HttpError } from "../utils/HttpError";
import { requestOtpForPhone, verifyOtpForPhone, requestOtpForEmail, verifyOtpForEmail } from "../services/otp.service";
import { uploadedFileUrl, deletePartnerFile } from "../config/upload";
import { PARTNER_FIXED_DAILY_PAY } from "../config/gifts";
import { uploadPreviewVideo as uploadPreviewVideoToDrive, deleteDriveFile, extractDriveFileId } from "../utils/googleDrive";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createGuest(_req: Request, res: Response) {
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const partner = await Partner.create({
    isGuest: true,
    name: `Guest partner ${guestNumber}`,
  });

  const token = signToken(String(partner._id), "partner");
  res.status(201).json({ token, partner });
}

export async function requestOtp(req: Request, res: Response) {
  const { phone } = req.body as { phone?: string };
  if (!phone) throw new HttpError(400, "phone is required");

  const { otp, expiresInMinutes } = await requestOtpForPhone(phone);
  res.json({ message: "OTP generated", phone, otp, expiresInMinutes });
}

export async function resendOtp(req: Request, res: Response) {
  const { phone } = req.body as { phone?: string };
  if (!phone) throw new HttpError(400, "phone is required");

  const { otp, expiresInMinutes } = await requestOtpForPhone(phone);
  res.json({ message: "OTP resent", phone, otp, expiresInMinutes });
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, otp } = req.body as { phone?: string; otp?: string };
  if (!phone || !otp) throw new HttpError(400, "phone and otp are required");

  await verifyOtpForPhone(phone, otp);

  let partner = await Partner.findOne({ phone });
  let isNewPartner = false;
  if (!partner) {
    partner = await Partner.create({ isGuest: false, phone, name: `Partner ${phone.slice(-4)}` });
    isNewPartner = true;
  }

  const token = signToken(String(partner._id), "partner");
  res.json({ token, partner, isNewPartner });
}

export async function requestEmailOtp(req: Request, res: Response) {
  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new HttpError(400, "A valid email is required");
  }

  const normalizedEmail = email.toLowerCase();
  const { expiresInMinutes } = await requestOtpForEmail(normalizedEmail);
  res.json({ message: "OTP generated", email: normalizedEmail, expiresInMinutes });
}

export async function resendEmailOtp(req: Request, res: Response) {
  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new HttpError(400, "A valid email is required");
  }

  const normalizedEmail = email.toLowerCase();
  const { expiresInMinutes } = await requestOtpForEmail(normalizedEmail);
  res.json({ message: "OTP resent", email: normalizedEmail, expiresInMinutes });
}

export async function verifyEmailOtp(req: Request, res: Response) {
  const { email, otp } = req.body as { email?: string; otp?: string };
  if (!email || !otp || !EMAIL_REGEX.test(email)) {
    throw new HttpError(400, "A valid email and otp are required");
  }

  const normalizedEmail = email.toLowerCase();
  await verifyOtpForEmail(normalizedEmail, otp);

  let partner = await Partner.findOne({ email: normalizedEmail });
  let isNewPartner = false;
  if (!partner) {
    partner = await Partner.create({
      isGuest: false,
      email: normalizedEmail,
      name: `Partner ${normalizedEmail.split("@")[0]}`,
    });
    isNewPartner = true;
  }

  const token = signToken(String(partner._id), "partner");
  res.json({ token, partner, isNewPartner });
}

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

export async function setAvailability(req: Request, res: Response) {
  const { isOnline } = req.body as { isOnline?: boolean };
  if (typeof isOnline !== "boolean") throw new HttpError(400, "isOnline must be a boolean");

  const partner = await Partner.findById(req.actor!.id);
  if (!partner) throw new HttpError(404, "Partner not found");
  if (isOnline && partner.verificationStatus !== "approved") {
    throw new HttpError(403, "Partner is not approved yet");
  }

  partner.isOnline = isOnline;
  await partner.save();

  if (isOnline) {
    await Attendance.findOneAndUpdate(
      { partnerId: partner._id, date: todayDateString() },
      { $setOnInsert: { fixedPayAmount: PARTNER_FIXED_DAILY_PAY, firstOnlineAt: new Date() } },
      { upsert: true }
    );
  }

  res.json({ isOnline: partner.isOnline });
}

export async function getDashboard(req: Request, res: Response) {
  const partnerId = req.actor!.id;
  const today = todayDateString();
  const startOfDay = new Date(`${today}T00:00:00.000Z`);

  const attendance = await Attendance.findOne({ partnerId, date: today });
  const giftBonusAgg = await PartnerTransaction.aggregate([
    { $match: { partnerId: new Types.ObjectId(partnerId), createdAt: { $gte: startOfDay } } },
    { $group: { _id: null, total: { $sum: "$amountCoins" } } },
  ]);
  const callsToday = await CallLog.find({
    partnerId,
    status: "completed",
    requestedAt: { $gte: startOfDay },
  }).select("durationSeconds");

  const callsCompleted = callsToday.length;
  const totalTalkSeconds = callsToday.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
  const avgCallDurationSeconds = callsCompleted ? Math.round(totalTalkSeconds / callsCompleted) : 0;

  res.json({
    isOnline: (await Partner.findById(partnerId).select("isOnline"))?.isOnline ?? false,
    fixedPayToday: attendance?.fixedPayAmount ?? 0,
    giftBonusToday: giftBonusAgg[0]?.total ?? 0,
    callsCompleted,
    totalTalkSeconds,
    avgCallDurationSeconds,
  });
}

export async function getPayoutSummary(req: Request, res: Response) {
  const partnerId = req.actor!.id;
  const date = typeof req.query.date === "string" ? req.query.date : todayDateString();
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const attendance = await Attendance.findOne({ partnerId, date });
  const giftBonusAgg = await PartnerTransaction.aggregate([
    {
      $match: {
        partnerId: new Types.ObjectId(partnerId),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    { $group: { _id: null, total: { $sum: "$amountCoins" } } },
  ]);
  const calls = await CallLog.find({
    partnerId,
    status: "completed",
    requestedAt: { $gte: startOfDay, $lte: endOfDay },
  }).select("durationSeconds");

  const callsCompleted = calls.length;
  const totalTalkSeconds = calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
  const avgCallDurationSeconds = callsCompleted ? Math.round(totalTalkSeconds / callsCompleted) : 0;
  const fixedPay = attendance?.fixedPayAmount ?? 0;
  const giftBonus = giftBonusAgg[0]?.total ?? 0;

  res.json({
    date,
    fixedPay,
    giftBonus,
    totalPayout: fixedPay + giftBonus,
    callsCompleted,
    totalTalkSeconds,
    avgCallDurationSeconds,
    settlementStatus: "to_be_paid_in_person",
  });
}

export async function listGiftHistory(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const transactions = await PartnerTransaction.find({ partnerId: req.actor!.id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ page, limit, transactions });
}
