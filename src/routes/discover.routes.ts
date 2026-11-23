import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { listDiscoverFeed, toggleFavorite, sayHello } from "../controllers/discover.controller";

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * /discover:
 *   get:
 *     summary: List discover feed (other users' profile cards)
 *     tags: [Discover]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: A page of discover profiles
 */
router.get("/", asyncHandler(listDiscoverFeed));

/**
 * @openapi
 * /discover/{userId}/favorite:
 *   post:
 *     summary: Toggle the heart icon on a discover card
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: New favorite state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorited: { type: boolean }
 */
router.post("/:userId/favorite", asyncHandler(toggleFavorite));

/**
 * @openapi
 * /discover/{userId}/say-hello:
 *   post:
 *     summary: Tap "Say hello" on a discover card - starts/continues a conversation
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string, description: "Optional custom greeting, defaults to a friendly hello" }
 *     responses:
 *       201:
 *         description: Conversation started/continued with the greeting message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversationId: { type: string }
 *                 message: { $ref: '#/components/schemas/Message' }
 */
router.post("/:userId/say-hello", asyncHandler(sayHello));

export default router;
