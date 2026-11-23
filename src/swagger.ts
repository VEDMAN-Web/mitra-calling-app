import swaggerJsdoc from "swagger-jsdoc";

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Mitra API",
      version: "1.0.0",
      description: "Backend API for the Mitra calling app (auth, discover, chat, coins/wallet, calls).",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            isGuest: { type: "boolean" },
            phone: { type: "string" },
            name: { type: "string" },
            age: { type: "number" },
            bio: { type: "string" },
            avatarUrl: { type: "string" },
            coinBalance: { type: "number" },
          },
        },
        Message: {
          type: "object",
          properties: {
            _id: { type: "string" },
            conversationId: { type: "string" },
            senderId: { type: "string" },
            text: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CoinPackage: {
          type: "object",
          properties: {
            id: { type: "string" },
            coins: { type: "number" },
            label: { type: "string" },
            priceInr: { type: "number" },
            bestValue: { type: "boolean" },
          },
        },
        CallLog: {
          type: "object",
          properties: {
            _id: { type: "string" },
            callerId: { type: "string" },
            calleeId: { type: "string" },
            type: { type: "string", enum: ["video", "voice"] },
            status: { type: "string", enum: ["ongoing", "completed"] },
            startedAt: { type: "string", format: "date-time" },
            endedAt: { type: "string", format: "date-time" },
            durationSeconds: { type: "number" },
            coinsCharged: { type: "number" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [`${__dirname.replace(/\\/g, "/")}/routes/*.{ts,js}`],
});

export default spec;
