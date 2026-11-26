import { Router } from "express";
import { requirePartnerAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadPartnerDocs, uploadPartnerPreviewVideo } from "../config/upload";
import {
  createGuest,
  requestOtp,
  verifyOtp,
  resendOtp,
  requestEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
  getMe,
  updateMe,
  uploadPreviewVideo,
  addVideo,
  submitVerification,
  setAvailability,
  getDashboard,
  getPayoutSummary,
  listGiftHistory,
} from "../controllers/partner.controller";
import { listConversations, getMessages } from "../controllers/chat.controller";
import { listCallHistory } from "../controllers/calls.controller";

const router = Router();

/**
 * @openapi
 * /partners/auth/guest:
 *   post:
 *     summary: Quick login - create an instant guest partner account
 *     description: Creates a brand-new guest partner account with no phone or email required and returns a JWT immediately. isGuest is true until the partner adds a phone or email via PATCH /partners/me.
 *     tags: [Partner Auth]
 *     security: []
 *     responses:
 *       201:
 *         description: Guest partner account created
 */
router.post("/auth/guest", asyncHandler(createGuest));

/**
 * @openapi
 * /partners/auth/otp/request:
 *   post:
 *     summary: Request an OTP for partner quick login
 *     description: Generates an OTP for the given partner phone number. No SMS provider is wired up yet, so the OTP is returned directly in the response for testing.
 *     tags: [Partner Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "+919876543210" }
 *     responses:
 *       200:
 *         description: OTP generated (returned directly since no SMS provider is wired up yet)
 */
router.post("/auth/otp/request", asyncHandler(requestOtp));

/**
 * @openapi
 * /partners/auth/otp/resend:
 *   post:
 *     summary: Resend the OTP for partner contact (phone) login
 *     description: Generates and sends a new OTP for the given partner phone number, replacing any previously generated one. No SMS provider is wired up yet, so the OTP is returned directly in the response for testing.
 *     tags: [Partner Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "+919876543210" }
 *     responses:
 *       200:
 *         description: OTP resent (returned directly since no SMS provider is wired up yet)
 */
router.post("/auth/otp/resend", asyncHandler(resendOtp));

/**
 * @openapi
 * /partners/auth/otp/verify:
 *   post:
 *     summary: Verify OTP and log in as a partner (creates the partner on first login)
 *     description: Verifies the OTP for a partner phone number and returns a JWT, creating the partner account on the first successful verification for that number.
 *     tags: [Partner Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone: { type: string }
 *               otp: { type: string }
 *     responses:
 *       200:
 *         description: Logged in
 */
router.post("/auth/otp/verify", asyncHandler(verifyOtp));

/**
 * @openapi
 * /partners/auth/email/otp/request:
 *   post:
 *     summary: Request an OTP for partner email login
 *     description: Generates an OTP for the given email address. No email provider is wired up yet, so a fixed dummy OTP (123456) is used for every email - it is not returned in the response.
 *     tags: [Partner Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "partner@gmail.com" }
 *     responses:
 *       200:
 *         description: OTP generated
 *       400:
 *         description: Invalid email
 */
router.post("/auth/email/otp/request", asyncHandler(requestEmailOtp));

/**
 * @openapi
 * /partners/auth/email/otp/resend:
 *   post:
 *     summary: Resend the OTP for partner email login
 *     description: Generates and sends a new OTP for the given email address, replacing any previously generated one. No email provider is wired up yet, so a fixed dummy OTP (123456) is used for every email - it is not returned in the response.
 *     tags: [Partner Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "partner@gmail.com" }
 *     responses:
 *       200:
 *         description: OTP resent
 *       400:
 *         description: Invalid email
 */
router.post("/auth/email/otp/resend", asyncHandler(resendEmailOtp));

/**
 * @openapi
 * /partners/auth/email/otp/verify:
 *   post:
 *     summary: Verify email OTP and log in as a partner (creates the partner on first login)
 *     description: Verifies the OTP for an email address and returns a JWT, creating the partner account on the first successful verification for that email.
 *     tags: [Partner Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: "partner@gmail.com" }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Logged in
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/auth/email/otp/verify", asyncHandler(verifyEmailOtp));

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

/**
 * @openapi
 * /partners/chats:
 *   get:
 *     summary: List my conversations (Partner Chats screen)
 *     description: Lists the authenticated partner's conversations with users, including each one's last message and unread count.
 *     tags: [Partner Chats]
 *     responses:
 *       200:
 *         description: Conversations with last message and unread count
 */
router.get("/chats", asyncHandler(listConversations));

/**
 * @openapi
 * /partners/chats/{conversationId}/messages:
 *   get:
 *     summary: Get messages in a conversation (also marks it as read)
 *     description: Returns a paginated page of messages in the conversation, oldest to newest, and marks it as read for the partner.
 *     tags: [Partner Chats]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Page of messages, oldest to newest
 */
router.get("/chats/:conversationId/messages", asyncHandler(getMessages));

// Sending a message is socket-only: emit "message:send" { conversationId, text } over Socket.io.
// Responding to and ending a call are socket-only too: emit "call:respond" { callId, accept } and
// "call:end" { callId }. There are no REST endpoints for any of these.

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
