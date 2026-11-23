import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { startCall, endCall, listCallHistory } from "../controllers/calls.controller";

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * /calls/start:
 *   post:
 *     summary: Start a video/voice call (text chat stays free, calls cost coins/minute)
 *     tags: [Calls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [calleeId, type]
 *             properties:
 *               calleeId: { type: string }
 *               type: { type: string, enum: [video, voice] }
 *     responses:
 *       201:
 *         description: Call started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call: { $ref: '#/components/schemas/CallLog' }
 *       402:
 *         description: Insufficient coin balance
 */
router.post("/start", asyncHandler(startCall));

/**
 * @openapi
 * /calls/{callId}/end:
 *   post:
 *     summary: End a call - bills coins for the elapsed duration
 *     tags: [Calls]
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Call ended and billed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call: { $ref: '#/components/schemas/CallLog' }
 *                 coinBalance: { type: number }
 */
router.post("/:callId/end", asyncHandler(endCall));

/**
 * @openapi
 * /calls/history:
 *   get:
 *     summary: List my call history
 *     tags: [Calls]
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
router.get("/history", asyncHandler(listCallHistory));

export default router;
