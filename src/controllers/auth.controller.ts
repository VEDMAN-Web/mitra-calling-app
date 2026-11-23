import { Request, Response } from "express";
import { User } from "../models/User";
import { Otp } from "../models/Otp";
import { Transaction } from "../models/Transaction";
import { signToken } from "../utils/jwt";
import { HttpError } from "../utils/HttpError";

const OTP_TTL_MINUTES = 5;
const SIGNUP_BONUS_COINS = 100;

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

  const token = signToken(String(user._id));
  res.status(201).json({ token, user });
}

export async function requestOtp(req: Request, res: Response) {
  const { phone } = req.body as { phone?: string };
  if (!phone || typeof phone !== "string") {
    throw new HttpError(400, "phone is required");
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await Otp.findOneAndUpdate({ phone }, { code, expiresAt }, { upsert: true });

  // No SMS provider wired up yet: return the OTP directly so the flow is usable in dev.
  res.json({ message: "OTP generated", phone, otp: code, expiresInMinutes: OTP_TTL_MINUTES });
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, otp } = req.body as { phone?: string; otp?: string };
  if (!phone || !otp) {
    throw new HttpError(400, "phone and otp are required");
  }

  const record = await Otp.findOne({ phone });
  if (!record || record.code !== otp || record.expiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired OTP");
  }
  await Otp.deleteOne({ _id: record._id });

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

  const token = signToken(String(user._id));
  res.json({ token, user, isNewUser });
}
