import { Router } from "express";
import { requireAuth, requireUserAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { startCall, endCall, listCallHistory } from "../controllers/calls.controller";

const router = Router();

/**
 * @openapi
 * /calls/start:
 *   post:
 *     summary: Start a video/voice call to a partner (rings the partner; text chat stays free, calls cost coins/minute once accepted)
 *     description: Creates a call in pending status and notifies the partner over Socket.io (call:incoming). Coins are only billed once the partner accepts.
 *     tags: [Calls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [partnerId, type]
 *             properties:
 *               partnerId: { type: string }
 *               type: { type: string, enum: [video, voice] }
 *     responses:
 *       201:
 *         description: Call requested (status pending until the partner responds)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 call: { $ref: '#/components/schemas/CallLog' }
 *       402:
 *         description: Insufficient coin balance
 */
router.post("/start", requireUserAuth, asyncHandler(startCall));

/**
 * @openapi
 * /calls/{callId}/end:
 *   post:
 *     summary: End a call (caller or partner) - bills coins for the elapsed duration once accepted
 *     description: Ends a call. If it's still pending it's simply cancelled; if it's ongoing, coins are billed for the time elapsed since the partner accepted.
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
router.post("/:callId/end", requireAuth, asyncHandler(endCall));

/**
 * @openapi
 * /calls/history:
 *   get:
 *     summary: List my call history (as a caller)
 *     description: Returns a paginated history of calls the authenticated user has made.
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
router.get("/history", requireUserAuth, asyncHandler(listCallHistory));

export default router;
