import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { getBalance, listPackages, purchasePackage, listTransactions } from "../controllers/coins.controller";

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * /coins/balance:
 *   get:
 *     summary: Get my coin balance (wallet header)
 *     tags: [Coins]
 *     responses:
 *       200:
 *         description: Current balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coinBalance: { type: number }
 */
router.get("/balance", asyncHandler(getBalance));

/**
 * @openapi
 * /coins/packages:
 *   get:
 *     summary: List coin packages (Get more coins)
 *     tags: [Coins]
 *     responses:
 *       200:
 *         description: Available coin packages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 packages:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CoinPackage' }
 */
router.get("/packages", asyncHandler(listPackages));

/**
 * @openapi
 * /coins/purchase:
 *   post:
 *     summary: Purchase a coin package (demo purchase only, no real payment)
 *     tags: [Coins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packageId]
 *             properties:
 *               packageId: { type: string, example: "extra_value" }
 *     responses:
 *       201:
 *         description: Purchase applied, new balance returned
 *       400:
 *         description: Invalid packageId
 */
router.post("/purchase", asyncHandler(purchasePackage));

/**
 * @openapi
 * /coins/transactions:
 *   get:
 *     summary: List my coin transaction history
 *     tags: [Coins]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Page of transactions
 */
router.get("/transactions", asyncHandler(listTransactions));

export default router;
