import { Router } from "express";
import { requireAdmin } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { listPendingPartners, approvePartner, rejectPartner } from "../controllers/partners.controller";

const router = Router();
router.use(requireAdmin);

/**
 * @openapi
 * /admin/partners/pending:
 *   get:
 *     summary: List partners awaiting verification review
 *     description: Lists partners whose verificationStatus is in_review, awaiting an admin's approve/reject decision.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Partners with verificationStatus = in_review
 *       401:
 *         description: Invalid or expired token
 */
router.get("/partners/pending", asyncHandler(listPendingPartners));

/**
 * @openapi
 * /admin/partners/{id}/approve:
 *   post:
 *     summary: Approve a partner's verification
 *     description: Sets the partner's verificationStatus to approved, making them eligible to appear in the Discover feed and go online.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Partner approved
 */
router.post("/partners/:id/approve", asyncHandler(approvePartner));

/**
 * @openapi
 * /admin/partners/{id}/reject:
 *   post:
 *     summary: Reject a partner's verification
 *     description: Sets the partner's verificationStatus to rejected with an optional reason, which is shown back to the partner.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Partner rejected
 */
router.post("/partners/:id/reject", asyncHandler(rejectPartner));

export default router;
