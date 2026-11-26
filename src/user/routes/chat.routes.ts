import { Router } from "express";
import { requireUserAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { listConversations, getMessages } from "../../shared/controllers/chat.controller";

const router = Router();
router.use(requireUserAuth);

/**
 * @openapi
 * /chats:
 *   get:
 *     summary: List my conversations (Messages screen)
 *     description: Lists the authenticated user's conversations with partners, including each one's last message and unread count.
 *     tags: [Chats]
 *     responses:
 *       200:
 *         description: Conversations with last message and unread count
 */
router.get("/", asyncHandler(listConversations));

/**
 * @openapi
 * /chats/{conversationId}/messages:
 *   get:
 *     summary: Get messages in a conversation (also marks it as read)
 *     description: Returns a paginated page of messages in the conversation, oldest to newest, and marks it as read for the caller.
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Page of messages, oldest to newest
 *       403:
 *         description: Not a participant of this conversation
 */
router.get("/:conversationId/messages", asyncHandler(getMessages));

// Sending a message is socket-only: emit "message:send" { conversationId, text } over Socket.io.
// There is no REST endpoint to post a message.

export default router;
