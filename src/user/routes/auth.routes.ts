import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { createGuest, /* requestOtp, verifyOtp, */ requestEmailOtp, resendEmailOtp, verifyEmailOtp, logout } from "../controllers/auth.controller";
import { adminLogin } from "../../admin/controllers/auth.controller";
import { requireAuth } from "../../common/middleware/auth";

const router = Router();

/**
 * @openapi
 * /auth/guest:
 *   post:
 *     summary: Quick login - create an instant guest account
 *     description: Creates a brand-new guest account with no phone number required and returns a JWT immediately - backs the Quick Login screen's "Continue as Guest" action.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       201:
 *         description: Guest account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 */
router.post("/guest", asyncHandler(createGuest));

// Phone OTP login disabled in favor of email OTP login below.
// /**
//  * @openapi
//  * /auth/otp/request:
//  *   post:
//  *     summary: Request an OTP for phone login (More login options)
//  *     description: Generates an OTP for the given phone number. No SMS provider is wired up yet, so the OTP is returned directly in the response for testing.
//  *     tags: [Auth]
//  *     security: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [phone]
//  *             properties:
//  *               phone: { type: string, example: "+919876543210" }
//  *     responses:
//  *       200:
//  *         description: OTP generated (returned directly since no SMS provider is wired up yet)
//  */
// router.post("/otp/request", asyncHandler(requestOtp));

// /**
//  * @openapi
//  * /auth/otp/verify:
//  *   post:
//  *     summary: Verify OTP and log in (creates the user on first login)
//  *     description: Verifies the OTP for a phone number and returns a JWT, creating the user account on the first successful verification for that number.
//  *     tags: [Auth]
//  *     security: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [phone, otp]
//  *             properties:
//  *               phone: { type: string }
//  *               otp: { type: string }
//  *     responses:
//  *       200:
//  *         description: Logged in
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 token: { type: string }
//  *                 user: { $ref: '#/components/schemas/User' }
//  *                 isNewUser: { type: boolean }
//  *       400:
//  *         description: Invalid or expired OTP
//  */
// router.post("/otp/verify", asyncHandler(verifyOtp));

/**
 * @openapi
 * /auth/email/otp/request:
 *   post:
 *     summary: Request an OTP for email login (More login options)
 *     description: Generates an OTP for the given email address. No email provider is wired up yet, so a fixed dummy OTP (123456) is used for every email - it is not returned in the response.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "someone@gmail.com" }
 *     responses:
 *       200:
 *         description: OTP generated
 *       400:
 *         description: Invalid email
 */
router.post("/email/otp/request", asyncHandler(requestEmailOtp));

/**
 * @openapi
 * /auth/email/otp/resend:
 *   post:
 *     summary: Resend an OTP for email login
 *     description: Generates a fresh OTP for the given email address, replacing any previously issued one. No email provider is wired up yet, so a fixed dummy OTP (123456) is used for every email - it is not returned in the response.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "someone@gmail.com" }
 *     responses:
 *       200:
 *         description: OTP resent
 *       400:
 *         description: Invalid email
 */
router.post("/email/otp/resend", asyncHandler(resendEmailOtp));

/**
 * @openapi
 * /auth/email/otp/verify:
 *   post:
 *     summary: Verify email OTP and log in (creates the user on first login)
 *     description: Verifies the OTP for an email address and returns a JWT, creating the user account on the first successful verification for that email.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: "someone@gmail.com" }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *                 isNewUser: { type: boolean }
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/email/otp/verify", asyncHandler(verifyEmailOtp));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out
 *     description: Invalidates the bearer token used in this request so it can no longer be used for authentication.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       401:
 *         description: Invalid or expired token
 */
router.post("/logout", requireAuth, asyncHandler(logout));

/**
 * @openapi
 * /auth/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Logs in with the admin credentials configured via ADMIN_EMAIL/ADMIN_PASSWORD env vars and returns a JWT with the admin role, used as a bearer token on /admin/* endpoints.
 *     tags: [Admin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "admin@mitra.app" }
 *               password: { type: string, example: "changeme" }
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *       401:
 *         description: Invalid admin credentials
 */
router.post("/admin/login", asyncHandler(adminLogin));

export default router;
