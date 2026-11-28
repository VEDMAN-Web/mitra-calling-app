import { Router } from "express";
import partnersRoutes from "./partners.routes";
import usersRoutes from "./users.routes";

const router = Router();

router.use("/", partnersRoutes);
router.use("/", usersRoutes);

export default router;
