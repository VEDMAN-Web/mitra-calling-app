import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken, ActorRole } from "../utils/jwt";
import { postMessage } from "../services/chat.service";
import { HttpError } from "../utils/HttpError";
import { room } from "./rooms";
import { registerCallHandlers } from "./calls.socket";

let io: Server | undefined;

export function initChatSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    try {
      const token = (socket.handshake.auth?.token ?? socket.handshake.query?.token) as string | undefined;
      if (!token) throw new Error("Missing auth token");
      const payload = verifyToken(token);
      socket.data.actor = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const actor: { id: string; role: ActorRole } = socket.data.actor;
    socket.join(room(actor.role, actor.id));

    socket.on(
      "message:send",
      async (
        payload: { conversationId?: string; text?: string },
        ack?: (response: { error?: string; message?: unknown }) => void
      ) => {
        try {
          const { conversationId, text } = payload || {};
          if (!conversationId || !text) throw new HttpError(400, "conversationId and text are required");

          const { conversation, message } = await postMessage(
            conversationId,
            actor as { id: string; role: "user" | "partner" },
            text
          );

          io!.to(room("user", String(conversation.userId))).emit("message:new", {
            conversationId: String(conversation._id),
            message,
          });
          io!.to(room("partner", String(conversation.partnerId))).emit("message:new", {
            conversationId: String(conversation._id),
            message,
          });

          ack?.({ message });
        } catch (err) {
          const errorMessage = err instanceof HttpError ? err.message : "Failed to send message";
          ack?.({ error: errorMessage });
        }
      }
    );

    registerCallHandlers(io!, socket, actor);
  });

  return io;
}

export function broadcastNewMessage(userId: string, partnerId: string, conversationId: string, message: unknown) {
  if (!io) return;
  io.to(room("user", userId)).emit("message:new", { conversationId, message });
  io.to(room("partner", partnerId)).emit("message:new", { conversationId, message });
}
