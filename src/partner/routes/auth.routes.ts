import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import {
  createGuest,
  requestOtp,
  verifyOtp,
  resendOtp,
  requestEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
} from "../controllers/auth.controller";

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
router.post("/guest", asyncHandler(createGuest));

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
router.post("/otp/request", asyncHandler(requestOtp));

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
router.post("/otp/resend", asyncHandler(resendOtp));

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
router.post("/otp/verify", asyncHandler(verifyOtp));

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
router.post("/email/otp/request", asyncHandler(requestEmailOtp));

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
router.post("/email/otp/resend", asyncHandler(resendEmailOtp));

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
router.post("/email/otp/verify", asyncHandler(verifyEmailOtp));

export default router;
