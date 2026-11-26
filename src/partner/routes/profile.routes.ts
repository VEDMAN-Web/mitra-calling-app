import { Router } from "express";
import { requirePartnerAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { uploadPartnerDocs, uploadPartnerPreviewVideo } from "../../config/upload";
import { getMe, updateMe, uploadPreviewVideo, addVideo, submitVerification } from "../controllers/profile.controller";

const router = Router();
router.use(requirePartnerAuth);

/**
 * @openapi
 * /partners/me:
 *   get:
 *     summary: Get my partner profile
 *     description: Returns the authenticated partner's own profile, including verification status.
 *     tags: [Partner Profile]
 *     responses:
 *       200:
 *         description: Current partner profile
 */
router.get("/me", asyncHandler(getMe));

/**
 * @openapi
 * /partners/me:
 *   patch:
 *     summary: Edit my partner profile (display name, languages, bio, avatar, phone, email)
 *     description: Updates one or more of the authenticated partner's editable profile fields. Omitted fields are left unchanged. Adding a phone or email turns a guest partner into a real one (isGuest becomes false); a guest partner who never adds either stays a guest.
 *     tags: [Partner Profile]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               languages: { type: array, items: { type: string } }
 *               bio: { type: string }
 *               avatar: { type: string, format: binary, description: "Profile photo file - uploaded and stored, served back as avatarUrl" }
 *               phone: { type: string }
 *               email: { type: string }
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               languages: { type: array, items: { type: string } }
 *               bio: { type: string }
 *               avatarUrl: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 *       409:
 *         description: Phone or email already in use
 */
router.patch("/me", uploadPartnerDocs.single("avatar"), asyncHandler(updateMe));

/**
 * @openapi
 * /partners/me/preview-video:
 *   post:
 *     summary: Upload my preview video
 *     description: Uploads a short preview video clip. It is stored in this partner's folder in Google Drive and the resulting Drive link is saved as previewUrl. Any previously uploaded preview video is deleted from Drive.
 *     tags: [Partner Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [previewVideo]
 *             properties:
 *               previewVideo: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Preview video uploaded
 *       400:
 *         description: previewVideo file is required
 */
router.post("/me/preview-video", uploadPartnerPreviewVideo.single("previewVideo"), asyncHandler(uploadPreviewVideo));

/**
 * @openapi
 * /partners/me/videos:
 *   post:
 *     summary: Add a video to my profile (max 3)
 *     description: Uploads a video clip and appends it to the partner's videos list, stored in this partner's folder in Google Drive. Fails with 409 once the partner already has 3 videos.
 *     tags: [Partner Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [video]
 *             properties:
 *               video: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Video added
 *       400:
 *         description: video file is required
 *       409:
 *         description: Already have the maximum of 3 videos
 */
router.post("/me/videos", uploadPartnerPreviewVideo.single("video"), asyncHandler(addVideo));

/**
 * @openapi
 * /partners/verification:
 *   post:
 *     summary: Submit ID + selfie for verification
 *     description: Uploads an ID document image and a selfie image for identity verification. Sets verificationStatus to approved immediately (for now, no admin review required).
 *     tags: [Partner Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [idType, idImage, selfieImage]
 *             properties:
 *               idType: { type: string, enum: [aadhaar, driving_licence, passport, voter_id] }
 *               age: { type: number }
 *               name: { type: string, description: "Display name" }
 *               idImage: { type: string, format: binary }
 *               selfieImage: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Verification submitted, status is now in_review
 */
router.post(
  "/verification",
  uploadPartnerDocs.fields([
    { name: "idImage", maxCount: 1 },
    { name: "selfieImage", maxCount: 1 },
  ]),
  asyncHandler(submitVerification)
);

export default router;
