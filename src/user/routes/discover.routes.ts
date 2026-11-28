import { Router } from "express";
import { requireUserAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import {
  listDiscoverFeed,
  getDiscoverProfile,
  getPartnerVideos,
  markPartnerVideoWatched,
  toggleFavorite,
  listFavorites,
  sayHello,
} from "../controllers/discover.controller";

const router = Router();
router.use(requireUserAuth);

/**
 * @openapi
 * /discover:
 *   get:
 *     summary: List discover feed (approved partner profile cards)
 *     description: Returns a randomly shuffled batch of approved partners for the Discover screen. Every call reshuffles. Partners that are not yet approved never appear here, nor do partners whose videos the current user has fully watched already.
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
 *     summary: Get a partner's next unwatched video
 *     description: Returns the partner's id and the next video (Google Drive link) the current user has NOT watched yet, one at a time. Each video can be watched once per user; once all of a partner's videos have been watched, `video` is null for that user.
 *     tags: [Discover]
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Partner's next unwatched video for the current user (or null if exhausted)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 video:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     url: { type: string, description: "Pass this to the mark-watched endpoint" }
 *       400:
 *         description: Invalid partner id
 *       404:
 *         description: Partner not found
 */
router.get("/:partnerId/videos", asyncHandler(getPartnerVideos));

/**
 * @openapi
 * /discover/{partnerId}/videos/watched:
 *   post:
 *     summary: Mark one of a partner's videos as watched
 *     description: Records that the current user has watched this video (identified by its Google Drive url). Call this once the video actually plays/finishes. Watched videos stop appearing in GET /discover/{partnerId}/videos for this user.
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
 *             required: [url]
 *             properties:
 *               url: { type: string, description: "The video url returned by GET /discover/{partnerId}/videos" }
 *     responses:
 *       200:
 *         description: Marked as watched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *       400:
 *         description: Invalid partner id, missing url, or url does not belong to this partner
 *       404:
 *         description: Partner not found
 */
router.post("/:partnerId/videos/watched", asyncHandler(markPartnerVideoWatched));

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

export default router;
