import { Otp } from "../models/Otp";
import { HttpError } from "../utils/HttpError";

const OTP_TTL_MINUTES = 5;
const EMAIL_DUMMY_OTP = "123456";

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestOtpForPhone(phone: string) {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await Otp.findOneAndUpdate({ phone }, { code, expiresAt }, { upsert: true });
  return { otp: code, expiresInMinutes: OTP_TTL_MINUTES };
}

export async function verifyOtpForPhone(phone: string, otp: string): Promise<void> {
  const record = await Otp.findOne({ phone });
  if (!record || record.code !== otp || record.expiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired OTP");
  }
  await Otp.deleteOne({ _id: record._id });
}

// No email provider wired up yet: always use a fixed dummy OTP so the flow is usable in dev.
export async function requestOtpForEmail(email: string) {
  const code = EMAIL_DUMMY_OTP;
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await Otp.findOneAndUpdate({ email }, { code, expiresAt }, { upsert: true });
  return { otp: code, expiresInMinutes: OTP_TTL_MINUTES };
}

export async function verifyOtpForEmail(email: string, otp: string): Promise<void> {
  const record = await Otp.findOne({ email });
  if (!record || record.code !== otp || record.expiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired OTP");
  }
  await Otp.deleteOne({ _id: record._id });
}
