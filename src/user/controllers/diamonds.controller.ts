import { Request, Response } from "express";
import { User } from "../../models/User";
import { Transaction } from "../../models/Transaction";
import { DIAMOND_PACKAGES } from "../../config/diamondPackages";
import { HttpError } from "../../common/utils/HttpError";

export async function getBalance(req: Request, res: Response) {
  const user = await User.findById(req.userId).select("diamondBalance");
  if (!user) throw new HttpError(404, "User not found");
  res.json({ diamondBalance: user.diamondBalance });
}

export async function listPackages(_req: Request, res: Response) {
  res.json({ packages: DIAMOND_PACKAGES });
}

export async function purchasePackage(req: Request, res: Response) {
  const { packageId } = req.body as { packageId?: string };
  const pack = DIAMOND_PACKAGES.find((p) => p.id === packageId);
  if (!pack) throw new HttpError(400, "Invalid packageId");

  // Demo purchase only: no real payment is processed.
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $inc: { diamondBalance: pack.diamonds } },
    { new: true }
  );
  if (!user) throw new HttpError(404, "User not found");

  await Transaction.create({
    userId: user._id,
    type: "purchase",
    amount: pack.diamonds,
    balanceAfter: user.diamondBalance,
    meta: { packageId: pack.id, priceInr: pack.priceInr },
  });

  res.status(201).json({ diamondBalance: user.diamondBalance, purchased: pack });
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
