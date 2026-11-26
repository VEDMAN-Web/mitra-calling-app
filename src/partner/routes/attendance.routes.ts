import { Router } from "express";
import { requirePartnerAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { setAvailability } from "../controllers/attendance.controller";

const router = Router();
router.use(requirePartnerAuth);

/**
 * @openapi
 * /partners/availability:
 *   post:
 *     summary: Go online/offline (going online the first time each day marks attendance for fixed daily pay)
 *     description: Toggles the partner's online status. The first time a partner goes online on a given calendar day, an attendance record is created for that day's fixed pay. Requires an approved verification status.
 *     tags: [Partner Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isOnline]
 *             properties:
 *               isOnline: { type: boolean }
 *     responses:
 *       200:
 *         description: New availability state
 *       403:
 *         description: Partner is not approved yet
 */
router.post("/availability", asyncHandler(setAvailability));

export default router;
