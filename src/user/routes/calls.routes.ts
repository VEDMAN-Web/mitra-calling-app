import { Router } from "express";
import { requireUserAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { listCallHistory } from "../controllers/calls.controller";

const router = Router();

/**
 * @openapi
 * /calls/history:
 *   get:
 *     summary: List my call history (as a caller)
 *     description: Returns a paginated history of calls the authenticated user has made. Calls themselves are started, accepted/declined and ended over Socket.io (call:start, call:respond, call:end) - there is no REST endpoint to start or end a call.
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
