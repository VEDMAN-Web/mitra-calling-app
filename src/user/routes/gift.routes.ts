import { Router } from "express";
import { requireUserAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { sendGift } from "../controllers/gift.controller";

const router = Router();
router.use(requireUserAuth);

/**
 * @openapi
 * /discover/{partnerId}/gift:
 *   post:
 *     summary: Send a gift to a partner (spends coins from the user's wallet)
 *     description: Deducts the gift's coin cost from the sender's wallet and credits half of that amount to the partner's gift bonus ledger.
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [giftId]
 *             properties:
 *               giftId: { type: string, example: "rose" }
 *     responses:
 *       201:
 *         description: Gift sent, sender's new coin balance returned
 *       400:
 *         description: Invalid giftId
 *       402:
 *         description: Insufficient coin balance
 */
router.post("/:partnerId/gift", asyncHandler(sendGift));

export default router;
