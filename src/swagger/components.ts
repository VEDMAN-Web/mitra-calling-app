export const securitySchemes = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
};

export const schemas = {
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
      imageUrl: { type: "string" },
      diamondBalance: { type: "number" },
    },
  },
  Message: {
    type: "object",
    properties: {
      _id: { type: "string" },
      conversationId: { type: "string" },
      senderRole: { type: "string", enum: ["user", "partner"] },
      text: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  Partner: {
    type: "object",
    properties: {
      _id: { type: "string" },
      isGuest: { type: "boolean" },
      phone: { type: "string" },
      email: { type: "string" },
      name: { type: "string" },
      age: { type: "number" },
      languages: { type: "array", items: { type: "string" } },
      bio: { type: "string" },
      avatarUrl: { type: "string" },
      isOnline: { type: "boolean" },
      verificationStatus: { type: "string", enum: ["not_submitted", "in_review", "approved", "rejected"] },
    },
  },
  Gift: {
    type: "object",
    properties: {
      id: { type: "string" },
      label: { type: "string" },
      emoji: { type: "string" },
      diamonds: { type: "number" },
    },
  },
  DiamondPackage: {
    type: "object",
    properties: {
      id: { type: "string" },
      diamonds: { type: "number" },
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
      partnerId: { type: "string" },
      type: { type: "string", enum: ["video"] },
      status: { type: "string", enum: ["pending", "ongoing", "declined", "completed"] },
      requestedAt: { type: "string", format: "date-time" },
      acceptedAt: { type: "string", format: "date-time" },
      endedAt: { type: "string", format: "date-time" },
      durationSeconds: { type: "number" },
      diamondsCharged: { type: "number" },
    },
  },
  Error: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
};
