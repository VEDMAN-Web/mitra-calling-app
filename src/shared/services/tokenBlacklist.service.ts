import { BlacklistedToken } from "../../models/BlacklistedToken";

export async function blacklistToken(token: string, expiresAt: Date): Promise<void> {
  await BlacklistedToken.updateOne({ token }, { $set: { expiresAt } }, { upsert: true });
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const found = await BlacklistedToken.exists({ token });
  return found !== null;
}
