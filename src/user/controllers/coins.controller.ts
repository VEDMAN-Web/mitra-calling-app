import { Request, Response } from "express";
import { User } from "../../models/User";
import { Transaction } from "../../models/Transaction";
import { COIN_PACKAGES } from "../../config/coinPackages";
import { HttpError } from "../../common/utils/HttpError";

export async function getBalance(req: Request, res: Response) {
  const user = await User.findById(req.userId).select("coinBalance");
  if (!user) throw new HttpError(404, "User not found");
  res.json({ coinBalance: user.coinBalance });
}

export async function listPackages(_req: Request, res: Response) {
  res.json({ packages: COIN_PACKAGES });
}

export async function purchasePackage(req: Request, res: Response) {
  const { packageId } = req.body as { packageId?: string };
  const pack = COIN_PACKAGES.find((p) => p.id === packageId);
  if (!pack) throw new HttpError(400, "Invalid packageId");

  // Demo purchase only: no real payment is processed.
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $inc: { coinBalance: pack.coins } },
    { new: true }
  );
  if (!user) throw new HttpError(404, "User not found");

  await Transaction.create({
    userId: user._id,
    type: "purchase",
    amount: pack.coins,
    balanceAfter: user.coinBalance,
    meta: { packageId: pack.id, priceInr: pack.priceInr },
  });

  res.status(201).json({ coinBalance: user.coinBalance, purchased: pack });
}

export async function listTransactions(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const transactions = await Transaction.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ page, limit, transactions });
}
