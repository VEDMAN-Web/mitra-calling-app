import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createGuest, requestOtp, verifyOtp } from "../controllers/auth.controller";

const router = Router();

/**
 * @openapi
 * /auth/guest:
 *   post:
 *     summary: Quick login - create an instant guest account
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

/**
 * @openapi
 * /auth/otp/request:
 *   post:
 *     summary: Request an OTP for phone login (More login options)
 *     tags: [Auth]
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
 * /auth/otp/verify:
 *   post:
 *     summary: Verify OTP and log in (creates the user on first login)
 *     tags: [Auth]
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
router.post("/otp/verify", asyncHandler(verifyOtp));

export default router;
