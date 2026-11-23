import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import discoverRoutes from "./discover.routes";
import chatRoutes from "./chat.routes";
import coinsRoutes from "./coins.routes";
import callsRoutes from "./calls.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/discover", discoverRoutes);
router.use("/chats", chatRoutes);
router.use("/coins", coinsRoutes);
router.use("/calls", callsRoutes);

export default router;
