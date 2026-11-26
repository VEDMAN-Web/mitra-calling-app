import { Request, Response } from "express";
import { Partner } from "../../models/Partner";
import { HttpError } from "../../common/utils/HttpError";

export async function listPendingPartners(_req: Request, res: Response) {
  const partners = await Partner.find({ verificationStatus: "in_review" }).sort({ createdAt: 1 });
  res.json({ partners });
}

export async function approvePartner(req: Request, res: Response) {
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new HttpError(404, "Partner not found");

  partner.verificationStatus = "approved";
  partner.rejectionReason = undefined;
  await partner.save();

  res.json({ partner });
}

export async function rejectPartner(req: Request, res: Response) {
  const { reason } = req.body as { reason?: string };
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new HttpError(404, "Partner not found");

  partner.verificationStatus = "rejected";
  partner.rejectionReason = reason || "Not specified";
  await partner.save();

  res.json({ partner });
}
