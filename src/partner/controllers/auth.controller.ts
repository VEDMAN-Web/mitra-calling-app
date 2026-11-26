import { Request, Response } from "express";
import { Partner } from "../../models/Partner";
import { signToken } from "../../common/utils/jwt";
import { HttpError } from "../../common/utils/HttpError";
import { requestOtpForPhone, verifyOtpForPhone, requestOtpForEmail, verifyOtpForEmail } from "../../shared/services/otp.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
