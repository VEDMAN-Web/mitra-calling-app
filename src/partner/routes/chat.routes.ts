import { Router } from "express";
import { requirePartnerAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { listConversations, getMessages } from "../../shared/controllers/chat.controller";

const router = Router();
router.use(requirePartnerAuth);

/**
 * @openapi
 * /partners/chats:
 *   get:
 *     summary: List my conversations (Partner Chats screen)
 *     description: Lists the authenticated partner's conversations with users, including each one's last message and unread count, most recently active first.
 *     tags: [Partner Chats]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Page of conversations with last message and unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 total: { type: integer }
 *                 conversations: { type: array, items: { type: object } }
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

// Sending a message is socket-only: emit "message:send" { conversationId, text } over Socket.io.
// Responding to and ending a call are socket-only too: emit "call:respond" { callId, accept } and
// "call:end" { callId }. There are no REST endpoints for any of these.

export default router;
