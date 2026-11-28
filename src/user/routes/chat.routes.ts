import { Router } from "express";
import { requireUserAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { listConversations, getMessages, logCall, sendChatMessage } from "../../shared/controllers/chat.controller";

const router = Router();
router.use(requireUserAuth);

/**
 * @openapi
 * /chats:
 *   get:
 *     summary: List my conversations (Messages screen)
 *     description: Lists the authenticated user's conversations with partners, including each one's last message and unread count, most recently active first.
 *     tags: [Chats]
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
 * /chats/{partnerId}/call-log:
 *   post:
 *     summary: Log a call's outcome into the conversation history
 *     description: Records whether a call with this partner was answered (with duration) or rejected, and who initiated it, posting it into the conversation as a call-type message so it shows up in the chat history.
 *     tags: [Chats]
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
 *             required: [status, callerRole]
 *             properties:
 *               status: { type: string, enum: [answer, reject] }
 *               callerRole: { type: string, enum: [user, partner], description: "Who initiated the call" }
 *               durationSeconds: { type: number, description: "Required when status is 'answer'" }
 *     responses:
 *       201:
 *         description: Call logged into the conversation
 *       400:
 *         description: Invalid partnerId, status, callerRole, or missing durationSeconds for an answered call
 *       404:
 *         description: Partner not found
 */
router.post("/:partnerId/call-log", asyncHandler(logCall));

/**
 * @openapi
 * /chats/message:
 *   post:
 *     summary: Send a chat message
 *     description: Posts a text message into the conversation with the given partner (creating the conversation if needed), recording who it was sent as, and broadcasts it in real time to both sides.
 *     tags: [Chats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [partnerId, message, chatRole]
 *             properties:
 *               partnerId: { type: string }
 *               message: { type: string }
 *               chatRole: { type: string, enum: [user, partner], description: "Who the message is sent as" }
 *     responses:
 *       201:
 *         description: Message posted into the conversation
 *       400:
 *         description: Invalid partnerId, missing message, or invalid chatRole
 *       404:
 *         description: Partner not found
 */
router.post("/message", asyncHandler(sendChatMessage));

// Sending a message in real time is also available over Socket.io: emit "message:send" { conversationId, text }.

export default router;
