import { Types } from "mongoose";
import { Conversation, IConversation } from "../../models/Conversation";
import { Message, IMessage, CallMessageStatus } from "../../models/Message";
import { HttpError } from "../../common/utils/HttpError";

function formatDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export interface Actor {
  id: string;
  role: "user" | "partner";
}

export async function assertParticipant(conversationId: string, actor: Actor): Promise<IConversation> {
  if (!Types.ObjectId.isValid(conversationId)) throw new HttpError(400, "Invalid conversation id");
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new HttpError(404, "Conversation not found");

  const ownsIt =
    (actor.role === "user" && String(conversation.userId) === actor.id) ||
    (actor.role === "partner" && String(conversation.partnerId) === actor.id);
  if (!ownsIt) throw new HttpError(403, "Not a participant of this conversation");

  return conversation;
}

export async function getOrCreateConversation(userId: string, partnerId: string): Promise<IConversation> {
  let conversation = await Conversation.findOne({ userId, partnerId });
  if (!conversation) {
    conversation = await Conversation.create({ userId, partnerId });
  }
  return conversation;
}

export async function postMessage(
  conversationId: string,
  actor: Actor,
  text: string
): Promise<{ conversation: IConversation; message: IMessage }> {
  const conversation = await assertParticipant(conversationId, actor);

  const trimmed = text.trim();
  if (!trimmed) throw new HttpError(400, "text is required");

  const message = await Message.create({
    conversationId: conversation._id,
    senderRole: actor.role,
    text: trimmed,
  });

  conversation.lastMessage = { text: message.text!, senderRole: actor.role, createdAt: message.createdAt };
  if (actor.role === "user") conversation.userLastReadAt = message.createdAt;
  else conversation.partnerLastReadAt = message.createdAt;
  await conversation.save();

  return { conversation, message };
}

export async function postCallLogMessage(
  conversationId: string,
  actor: Actor,
  status: CallMessageStatus,
  durationSeconds?: number
): Promise<{ conversation: IConversation; message: IMessage }> {
  const conversation = await assertParticipant(conversationId, actor);

  const message = await Message.create({
    conversationId: conversation._id,
    senderRole: actor.role,
    type: "call",
    call: status === "answered" ? { status, durationSeconds } : { status },
  });

  const summaryText = status === "answered" ? `Call ended - ${formatDuration(durationSeconds!)}` : "Call declined";
  conversation.lastMessage = { text: summaryText, senderRole: actor.role, createdAt: message.createdAt };
  if (actor.role === "user") conversation.userLastReadAt = message.createdAt;
  else conversation.partnerLastReadAt = message.createdAt;
  await conversation.save();

  return { conversation, message };
}
