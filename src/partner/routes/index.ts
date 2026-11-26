import { Router } from "express";
import authRoutes from "./auth.routes";
import profileRoutes from "./profile.routes";
import attendanceRoutes from "./attendance.routes";
import earningsRoutes from "./earnings.routes";
import callsRoutes from "./calls.routes";
import chatRoutes from "./chat.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", profileRoutes);
router.use("/", attendanceRoutes);
router.use("/", earningsRoutes);
router.use("/", callsRoutes);
router.use("/", chatRoutes);

export default router;
