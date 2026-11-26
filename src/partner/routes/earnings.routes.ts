import { Router } from "express";
import { requirePartnerAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { getDashboard, getPayoutSummary, listGiftHistory } from "../controllers/earnings.controller";

const router = Router();
router.use(requirePartnerAuth);

/**
 * @openapi
 * /partners/dashboard:
 *   get:
 *     summary: Today's home screen summary (fixed pay, gift bonus, KPIs)
 *     description: Returns today's dashboard numbers, computed on the fly from today's attendance, calls, and gift bonus records.
 *     tags: [Partner Profile]
 *     responses:
 *       200:
 *         description: Today's dashboard numbers
 */
router.get("/dashboard", asyncHandler(getDashboard));

/**
 * @openapi
 * /partners/payout:
 *   get:
 *     summary: Daily payout summary (fixed pay + gift bonus; settled in person, no in-app withdrawal)
 *     description: Returns the fixed pay plus gift bonus total for the given date (defaults to today). Payouts are settled in person; there is no in-app withdrawal.
 *     tags: [Partner Profile]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Defaults to today (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Payout summary for the given date
 */
router.get("/payout", asyncHandler(getPayoutSummary));

/**
 * @openapi
 * /partners/gifts:
 *   get:
 *     summary: List my gift bonus history
 *     description: Returns a paginated history of gift bonus credits the partner has received from users' gifts.
 *     tags: [Partner Profile]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Page of gift bonus transactions
 */
router.get("/gifts", asyncHandler(listGiftHistory));

export default router;
