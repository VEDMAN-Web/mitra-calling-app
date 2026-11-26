import { Router } from "express";
import { requireUserAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { getBalance, listPackages, purchasePackage, listTransactions } from "../controllers/coins.controller";

const router = Router();
router.use(requireUserAuth);

/**
 * @openapi
 * /coins/balance:
 *   get:
 *     summary: Get my coin balance (wallet header)
 *     description: Returns the authenticated user's current coin balance, as shown in the wallet header on every screen.
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
 *     description: Lists the purchasable coin packages shown on the "Get more coins" screen.
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
 *     description: Credits the user's wallet with the coins from the given package and records a purchase transaction. No real payment is processed.
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
 *     description: Returns a paginated history of the user's coin transactions (purchases, call deductions, gifts sent, signup bonus).
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
