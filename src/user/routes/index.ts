import { Router } from "express";
import authRoutes from "./auth.routes";
import profileRoutes from "./profile.routes";
import discoverRoutes from "./discover.routes";
import giftRoutes from "./gift.routes";
import chatRoutes from "./chat.routes";
import diamondsRoutes from "./diamonds.routes";
import callsRoutes from "./calls.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", profileRoutes);
router.use("/discover", discoverRoutes);
router.use("/discover", giftRoutes);
router.use("/chats", chatRoutes);
router.use("/diamonds", diamondsRoutes);
router.use("/calls", callsRoutes);

export default router;
