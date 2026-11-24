import { Router } from "express";
import { requirePartnerAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadPartnerDocs } from "../config/upload";
import {
  requestOtp,
  verifyOtp,
  getMe,
  updateMe,
  submitVerification,
  setAvailability,
  getDashboard,
  getPayoutSummary,
  listGiftHistory,
} from "../controllers/partner.controller";
import { listConversations, getMessages, sendMessage } from "../controllers/chat.controller";
import { respondToCall, endCall, listCallHistory } from "../controllers/calls.controller";

const router = Router();

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
 *     summary: Edit my partner profile (display name, languages, bio, avatar)
 *     description: Updates one or more of the authenticated partner's editable profile fields. Omitted fields are left unchanged.
 *     tags: [Partner Profile]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               languages: { type: array, items: { type: string } }
 *               bio: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.patch("/me", asyncHandler(updateMe));

/**
 * @openapi
 * /partners/verification:
 *   post:
 *     summary: Submit ID + selfie for verification (sets status to in_review)
 *     description: Uploads an ID document image and a selfie image for identity verification and sets verificationStatus to in_review pending admin approval.
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

/**
 * @openapi
 * /partners/chats/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     description: Posts a text message to the conversation. It is also pushed in real time to both participants over Socket.io (message:new).
 *     tags: [Partner Chats]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post("/chats/:conversationId/messages", asyncHandler(sendMessage));

/**
 * @openapi
 * /partners/calls/{callId}/respond:
 *   post:
 *     summary: Accept or decline an incoming call request
 *     description: Accepts or declines a pending call. Accepting moves it to ongoing and notifies the caller (call:accepted); declining notifies the caller too (call:declined).
 *     tags: [Partner Calls]
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accept]
 *             properties:
 *               accept: { type: boolean }
 *     responses:
 *       200:
 *         description: Call accepted (status ongoing) or declined
 */
router.post("/calls/:callId/respond", asyncHandler(respondToCall));

/**
 * @openapi
 * /partners/calls/{callId}/end:
 *   post:
 *     summary: End a call from the partner side
 *     description: Ends an ongoing call, billing the caller's coins for the time elapsed since the call was accepted.
 *     tags: [Partner Calls]
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Call ended and billed
 */
router.post("/calls/:callId/end", asyncHandler(endCall));

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
