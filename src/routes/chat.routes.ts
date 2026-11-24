import { Router } from "express";
import { requireUserAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { listConversations, getMessages, sendMessage } from "../controllers/chat.controller";

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

/**
 * @openapi
 * /chats/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     description: Posts a text message to the conversation. It is also pushed in real time to both participants over Socket.io (message:new).
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { $ref: '#/components/schemas/Message' }
 */
router.post("/:conversationId/messages", asyncHandler(sendMessage));

export default router;
