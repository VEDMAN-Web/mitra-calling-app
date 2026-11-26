import { Router } from "express";
import { requirePartnerAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { listCallHistory } from "../../shared/controllers/calls.controller";

const router = Router();
router.use(requirePartnerAuth);

/**
 * @openapi
 * /partners/calls/history:
 *   get:
 *     summary: List my call history (as a partner)
 *     description: Returns a paginated history of calls the authenticated partner has received.
 *     tags: [Partner Calls]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Page of past calls
 */
router.get("/calls/history", asyncHandler(listCallHistory));

export default router;
