import { Router } from "express";
import userRoutes from "../user/routes";
import partnerRoutes from "../partner/routes";
import adminRoutes from "../admin/routes";

const router = Router();

router.use(userRoutes);
router.use("/partners", partnerRoutes);
router.use("/admin", adminRoutes);

export default router;
