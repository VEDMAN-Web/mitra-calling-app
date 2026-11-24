import { Request, Response } from "express";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";
import { signToken, getTokenExpiry } from "../utils/jwt";
import { HttpError } from "../utils/HttpError";
import { requestOtpForPhone, verifyOtpForPhone, requestOtpForEmail, verifyOtpForEmail } from "../services/otp.service";
import { blacklistToken } from "../services/tokenBlacklist.service";

const SIGNUP_BONUS_COINS = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function grantSignupBonus(userId: string) {
  const user = await User.findById(userId);
  if (!user) return;
  await Transaction.create({
    userId: user._id,
    type: "signup_bonus",
    amount: user.coinBalance,
    balanceAfter: user.coinBalance,
  });
}

export async function createGuest(_req: Request, res: Response) {
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const user = await User.create({
    isGuest: true,
    name: `Guest explorer ${guestNumber}`,
    coinBalance: SIGNUP_BONUS_COINS,
  });
  await grantSignupBonus(String(user._id));

  const token = signToken(String(user._id), "user");
  res.status(201).json({ token, user });
}

export async function requestOtp(req: Request, res: Response) {
  const { phone } = req.body as { phone?: string };
  if (!phone || typeof phone !== "string") {
    throw new HttpError(400, "phone is required");
  }

  // No SMS provider wired up yet: return the OTP directly so the flow is usable in dev.
  const { otp, expiresInMinutes } = await requestOtpForPhone(phone);
  res.json({ message: "OTP generated", phone, otp, expiresInMinutes });
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, otp } = req.body as { phone?: string; otp?: string };
  if (!phone || !otp) {
    throw new HttpError(400, "phone and otp are required");
  }

  await verifyOtpForPhone(phone, otp);

  let user = await User.findOne({ phone });
  let isNewUser = false;
  if (!user) {
    user = await User.create({
      isGuest: false,
      phone,
      name: `User ${phone.slice(-4)}`,
      coinBalance: SIGNUP_BONUS_COINS,
    });
    isNewUser = true;
  }
  if (isNewUser) {
    await grantSignupBonus(String(user._id));
  }

  const token = signToken(String(user._id), "user");
  res.json({ token, user, isNewUser });
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

  let user = await User.findOne({ email: normalizedEmail });
  let isNewUser = false;
  if (!user) {
    user = await User.create({
      isGuest: false,
      email: normalizedEmail,
      name: `User ${normalizedEmail.split("@")[0]}`,
      coinBalance: SIGNUP_BONUS_COINS,
    });
    isNewUser = true;
  }
  if (isNewUser) {
    await grantSignupBonus(String(user._id));
  }

  const token = signToken(String(user._id), "user");
  res.json({ token, user, isNewUser });
}

export async function logout(req: Request, res: Response) {
  const token = req.token!;
  await blacklistToken(token, getTokenExpiry(token));

  if (req.actor?.role === "user") {
    const user = await User.findById(req.actor.id).select("isGuest");
    if (user?.isGuest) await user.deleteOne();
  }

  res.json({ message: "Logged out" });
}
