import { Router } from "express";
import { requireAdmin } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { uploadPartnerMedia } from "../../config/upload";

const partnerMediaFields = uploadPartnerMedia.fields([
  { name: "avatar", maxCount: 1 },
  { name: "assets", maxCount: 5 },
  { name: "previewVideo", maxCount: 1 },
  { name: "videos", maxCount: 3 },
]);
import {
  listPendingPartners,
  approvePartner,
  rejectPartner,
  listPartners,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
} from "../controllers/partners.controller";

const router = Router();
router.use(requireAdmin);

/**
 * @openapi
 * /admin/partners:
 *   get:
 *     summary: List partners
 *     description: Lists partners with pagination, optional search (name/phone/email) and filters.
 *     tags: [Admin Partners]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: verificationStatus
 *         schema: { type: string, enum: [not_submitted, in_review, approved, rejected] }
 *       - in: query
 *         name: isOnline
 *         schema: { type: boolean }
 *       - in: query
 *         name: isVip
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated list of partners
 */
router.get("/partners", asyncHandler(listPartners));

/**
 * @openapi
 * /admin/partners/pending:
 *   get:
 *     summary: List partners awaiting verification review
 *     description: Lists partners whose verificationStatus is in_review, awaiting an admin's approve/reject decision.
 *     tags: [Admin Partners]
 *     responses:
 *       200:
 *         description: Partners with verificationStatus = in_review
 *       401:
 *         description: Invalid or expired token
 */
router.get("/partners/pending", asyncHandler(listPendingPartners));

/**
 * @openapi
 * /admin/partners/{id}:
 *   get:
 *     summary: Get a partner by id
 *     tags: [Admin Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Partner found
 *       404:
 *         description: Partner not found
 */
router.get("/partners/:id", asyncHandler(getPartner));

/**
 * @openapi
 * /admin/partners:
 *   post:
 *     summary: Create a partner
 *     description: Creates a new, non-guest partner record.
 *     tags: [Admin Partners]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               age: { type: number }
 *               languages: { type: array, items: { type: string } }
 *               bio: { type: string }
 *               isVip: { type: boolean }
 *               avatar: { type: string, format: binary, description: "Profile photo" }
 *               assets: { type: array, items: { type: string, format: binary }, description: "Gallery images, up to 5" }
 *               previewVideo: { type: string, format: binary, description: "Short preview clip, stored in Google Drive" }
 *               videos: { type: array, items: { type: string, format: binary }, description: "Profile videos, up to 3, stored in Google Drive" }
 *     responses:
 *       201:
 *         description: Partner created
 *       400:
 *         description: name is required, or more than 5 assets / 3 videos were sent
 *       409:
 *         description: Phone or email already in use
 */
router.post("/partners", partnerMediaFields, asyncHandler(createPartner));

/**
 * @openapi
 * /admin/partners/{id}:
 *   patch:
 *     summary: Update a partner
 *     description: Updates one or more of a partner's fields. Omitted fields are left unchanged.
 *     tags: [Admin Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               age: { type: number }
 *               languages: { type: array, items: { type: string } }
 *               bio: { type: string }
 *               isVip: { type: boolean }
 *               isOnline: { type: boolean }
 *               avatar: { type: string, format: binary, description: "Profile photo - replaces the existing one" }
 *               assets: { type: array, items: { type: string, format: binary }, description: "Gallery images, up to 5 - replaces the existing set" }
 *               previewVideo: { type: string, format: binary, description: "Short preview clip - replaces the existing one, stored in Google Drive" }
 *               videos: { type: array, items: { type: string, format: binary }, description: "Profile videos, up to 3 - replaces the existing set, stored in Google Drive" }
 *     responses:
 *       200:
 *         description: Updated partner
 *       404:
 *         description: Partner not found
 *       409:
 *         description: Phone or email already in use
 */
router.patch("/partners/:id", partnerMediaFields, asyncHandler(updatePartner));

/**
 * @openapi
 * /admin/partners/{id}:
 *   delete:
 *     summary: Delete a partner
 *     tags: [Admin Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Partner deleted
 *       404:
 *         description: Partner not found
 */
router.delete("/partners/:id", asyncHandler(deletePartner));

/**
 * @openapi
 * /admin/partners/{id}/approve:
 *   post:
 *     summary: Approve a partner's verification
 *     description: Sets the partner's verificationStatus to approved, making them eligible to appear in the Discover feed and go online.
 *     tags: [Admin Partners]
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
 *     tags: [Admin Partners]
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
