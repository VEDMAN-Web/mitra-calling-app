import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import discoverRoutes from "./discover.routes";
import chatRoutes from "./chat.routes";
import coinsRoutes from "./coins.routes";
import callsRoutes from "./calls.routes";
import partnerRoutes from "./partner.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/discover", discoverRoutes);
router.use("/chats", chatRoutes);
router.use("/coins", coinsRoutes);
router.use("/calls", callsRoutes);
router.use("/partners", partnerRoutes);
router.use("/admin", adminRoutes);

export default router;
