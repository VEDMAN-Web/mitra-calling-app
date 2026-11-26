import { Router } from "express";
import { requireUserAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listDiscoverFeed,
  getDiscoverProfile,
  getPartnerVideos,
  toggleFavorite,
  listFavorites,
  sayHello,
} from "../controllers/discover.controller";
import { sendGift } from "../controllers/gift.controller";

const router = Router();
router.use(requireUserAuth);

/**
 * @openapi
 * /discover:
 *   get:
 *     summary: List discover feed (approved partner profile cards)
 *     description: Returns a randomly shuffled batch of approved partners for the Discover screen. Every call reshuffles. Partners that are not yet approved never appear here.
 *     tags: [Discover]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Batch size to return
 *       - in: query
 *         name: isVip
 *         schema: { type: boolean }
 *         description: Filter to only VIP (true) or non-VIP (false) partners; shuffling is applied within this filtered set
 *     responses:
 *       200:
 *         description: A randomly shuffled batch of discover profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 limit: { type: integer }
 *                 profiles: { type: array, items: { type: object } }
 */
router.get("/", asyncHandler(listDiscoverFeed));

/**
 * @openapi
 * /discover/{partnerId}/videos:
 *   get:
 *     summary: Get a partner's videos
 *     description: Returns just the partner's id and their uploaded videos list (Google Drive links).
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Partner videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 videos: { type: array, items: { type: string } }
 *       400:
 *         description: Invalid partner id
 *       404:
 *         description: Partner not found
 */
router.get("/:partnerId/videos", asyncHandler(getPartnerVideos));

/**
 * @openapi
 * /discover/{partnerId}/favorite:
 *   post:
 *     summary: Toggle the heart icon on a discover card
 *     description: Adds or removes the given partner from the current user's favorites, flipping whatever the current state is, and returns the new state.
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: partnerId
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
router.post("/:partnerId/favorite", asyncHandler(toggleFavorite));

/**
 * @openapi
 * /discover/favorites:
 *   get:
 *     summary: List my favorited partners (paginated)
 *     description: Returns a paginated list of the partners the current user has favorited, most recently favorited first.
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
 *         description: A page of favorited partner profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 total: { type: integer, description: "Total number of favorited partners" }
 *                 profiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       age: { type: number }
 *                       bio: { type: string }
 *                       selfieImageUrl: { type: string }
 *                       languages: { type: array, items: { type: string } }
 *                       isOnline: { type: boolean }
 *                       isFavorited: { type: boolean }
 */
router.get("/favorites", asyncHandler(listFavorites));

/**
 * @openapi
 * /discover/{id}:
 *   get:
 *     summary: Get full details of a single discover profile
 *     description: Returns the full profile for one approved partner, for the profile detail screen.
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full partner profile
 *       400:
 *         description: Invalid partner id
 *       404:
 *         description: Partner not found (or not approved)
 */
router.get("/:id", asyncHandler(getDiscoverProfile));

/**
 * @openapi
 * /discover/{partnerId}/say-hello:
 *   post:
 *     summary: Tap "Say hello" on a discover card - starts/continues a conversation
 *     description: Creates a conversation with the partner if one doesn't exist yet (otherwise reuses it) and posts a greeting message into it. Guest accounts must log in properly first.
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: partnerId
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
 *       403:
 *         description: Guest accounts must log in to say hello
 */
router.post("/:partnerId/say-hello", asyncHandler(sayHello));

/**
 * @openapi
 * /discover/{partnerId}/gift:
 *   post:
 *     summary: Send a gift to a partner (spends coins from the user's wallet)
 *     description: Deducts the gift's coin cost from the sender's wallet and credits half of that amount to the partner's gift bonus ledger.
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [giftId]
 *             properties:
 *               giftId: { type: string, example: "rose" }
 *     responses:
 *       201:
 *         description: Gift sent, sender's new coin balance returned
 *       400:
 *         description: Invalid giftId
 *       402:
 *         description: Insufficient coin balance
 */
router.post("/:partnerId/gift", asyncHandler(sendGift));

export default router;
