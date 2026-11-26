import { Router } from "express";
import partnersRoutes from "./partners.routes";

const router = Router();

router.use("/", partnersRoutes);

export default router;
