import dotenv from "dotenv";
dotenv.config();

import express from "express";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/db";
import apiRoutes from "./routes";
import swaggerSpec from "./swagger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mitra_calling_app";

connectDB(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
