import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../../models/User";
import { Partner } from "../../models/Partner";
import { Transaction } from "../../models/Transaction";
import { PartnerTransaction } from "../../models/PartnerTransaction";
import { GIFTS, PARTNER_GIFT_SHARE } from "../../config/gifts";
import { HttpError } from "../../common/utils/HttpError";

export async function sendGift(req: Request, res: Response) {
  const partnerId = String(req.params.partnerId);
  if (!Types.ObjectId.isValid(partnerId)) throw new HttpError(400, "Invalid partner id");

  const { giftId } = req.body as { giftId?: string };
  const gift = GIFTS.find((g) => g.id === giftId);
  if (!gift) throw new HttpError(400, "Invalid giftId");

  const partner = await Partner.findById(partnerId);
  if (!partner) throw new HttpError(404, "Partner not found");

  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(404, "User not found");
  if (user.diamondBalance < gift.diamonds) throw new HttpError(402, "Insufficient diamond balance");

  user.diamondBalance -= gift.diamonds;
  await user.save();

  await Transaction.create({
    userId: user._id,
    type: "gift_sent",
    amount: -gift.diamonds,
    balanceAfter: user.diamondBalance,
    meta: { giftId: gift.id, partnerId },
  });

  const partnerBonus = Math.round(gift.diamonds * PARTNER_GIFT_SHARE);
  await PartnerTransaction.create({
    partnerId: partner._id,
    type: "gift_bonus",
    amountDiamonds: partnerBonus,
    meta: { giftId: gift.id, userId: String(user._id) },
  });

  res.status(201).json({ diamondBalance: user.diamondBalance, gift, partnerBonus });
}
