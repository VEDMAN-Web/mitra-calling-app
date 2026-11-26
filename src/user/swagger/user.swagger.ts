import swaggerJsdoc from "swagger-jsdoc";
import { securitySchemes, schemas } from "../../swagger/components";
import { dropTag } from "../../swagger/filterByTag";

const routesDir = `${__dirname.replace(/\\/g, "/")}/../routes`;

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Mitra User API",
      version: "1.0.0",
      description: `Backend API for the Mitra user app (auth, discover, chat, coins/wallet, calls). For the partner-side API (the people who get called), see /partner/api-docs. For admin endpoints, see /admin/api-docs.

## Real-time events (Socket.io)

Chat messages and call status updates are also delivered over Socket.io, in addition to the REST endpoints documented below. This is **not** a REST endpoint and cannot be tried out from this page — connect with a Socket.io client instead:

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
| \`call:accepted\` | \`{ callId }\` — the partner accepted your call request |
| \`call:declined\` | \`{ callId }\` — the partner declined your call request |
| \`call:ended\` | \`{ callId, durationSeconds? }\` — the call ended |

Sending via \`POST /chats/{conversationId}/messages\` also triggers a \`message:new\` push to connected sockets, so REST and Socket.io stay in sync. The call events above are only ever pushed over Socket.io — \`POST /calls/start\` and \`POST /calls/{callId}/end\` are what actually start/end a call.`,
    },
    servers: [{ url: "/api" }],
    components: { securitySchemes, schemas },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    `${routesDir}/auth.routes.{ts,js}`,
    `${routesDir}/profile.routes.{ts,js}`,
    `${routesDir}/discover.routes.{ts,js}`,
    `${routesDir}/gift.routes.{ts,js}`,
    `${routesDir}/chat.routes.{ts,js}`,
    `${routesDir}/coins.routes.{ts,js}`,
    `${routesDir}/calls.routes.{ts,js}`,
  ],
}) as any;

export default dropTag(spec, "Admin");
