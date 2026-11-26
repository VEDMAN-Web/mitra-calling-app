import "dotenv/config";

import http from "http";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/db";
import apiRoutes from "./routes";
import userSwaggerSpec from "./user/swagger/user.swagger";
import partnerSwaggerSpec from "./partner/swagger/partner.swagger";
import adminSwaggerSpec from "./admin/swagger/admin.swagger";
import { errorHandler, notFoundHandler } from "./common/middleware/errorHandler";
import { initChatSocket } from "./sockets/chat.socket";
import { UPLOADS_ROOT } from "./config/upload";

const app = express();
const httpServer = http.createServer(app);
initChatSocket(httpServer);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/uploads", express.static(UPLOADS_ROOT));
app.use("/user/api-docs", swaggerUi.serveFiles(userSwaggerSpec), swaggerUi.setup(userSwaggerSpec));
app.use("/partner/api-docs", swaggerUi.serveFiles(partnerSwaggerSpec), swaggerUi.setup(partnerSwaggerSpec));
app.use("/admin/api-docs", swaggerUi.serveFiles(adminSwaggerSpec), swaggerUi.setup(adminSwaggerSpec));
app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mitra_calling_app";

connectDB(MONGODB_URI)
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
