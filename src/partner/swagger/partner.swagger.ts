import swaggerJsdoc from "swagger-jsdoc";
import { securitySchemes, schemas } from "../../swagger/components";

const routesDir = `${__dirname.replace(/\\/g, "/")}/../routes`;

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Mitra Partner API",
      version: "1.0.0",
      description: `Backend API for the Mitra partner app (the people who get called): auth, profile, ID/selfie verification, availability, chats, calls, earnings. For the user-side API, see /user/api-docs. For admin endpoints (partner verification review), see /admin/api-docs.

## Real-time events (Socket.io)

Chat messages and incoming calls are also delivered over Socket.io, in addition to the REST endpoints documented below. This is **not** a REST endpoint and cannot be tried out from this page — connect with a Socket.io client instead:

\`\`\`js
const socket = io("http://localhost:5000", { auth: { token: "<jwt>" } });
\`\`\`

Each socket authenticates with the same JWT used for REST calls and auto-joins a personal room, so events arrive regardless of which screen is open.

**Client → server**

| Event | Payload | Ack response |
|---|---|---|
| \`message:send\` | \`{ conversationId, text }\` | \`{ message }\` or \`{ error }\` |

**Server → client**

| Event | Payload |
|---|---|
| \`message:new\` | \`{ conversationId, message }\` — sent to both sides of a conversation |
| \`call:incoming\` | \`{ callId, type, caller }\` — a user is calling you |
| \`call:ended\` | \`{ callId, durationSeconds? }\` — the call ended |

Sending via \`POST /partners/chats/{conversationId}/messages\` also triggers a \`message:new\` push to connected sockets, so REST and Socket.io stay in sync. \`call:incoming\` is how you learn about a ringing call — respond to it with \`POST /partners/calls/{callId}/respond\`.`,
    },
    servers: [{ url: "/api" }],
    components: { securitySchemes, schemas },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    `${routesDir}/auth.routes.{ts,js}`,
    `${routesDir}/profile.routes.{ts,js}`,
    `${routesDir}/attendance.routes.{ts,js}`,
    `${routesDir}/earnings.routes.{ts,js}`,
    `${routesDir}/calls.routes.{ts,js}`,
    `${routesDir}/chat.routes.{ts,js}`,
  ],
});

export default spec;
