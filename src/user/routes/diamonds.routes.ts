import { Router } from "express";
import { requireUserAuth } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { getBalance, listPackages, purchasePackage, listTransactions } from "../controllers/diamonds.controller";

const router = Router();
router.use(requireUserAuth);

/**
 * @openapi
 * /diamonds/balance:
 *   get:
 *     summary: Get my diamond balance (wallet header)
 *     description: Returns the authenticated user's current diamond balance, as shown in the wallet header on every screen.
 *     tags: [Diamonds]
 *     responses:
 *       200:
 *         description: Current balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 diamondBalance: { type: number }
 */
router.get("/balance", asyncHandler(getBalance));

/**
 * @openapi
 * /diamonds/packages:
 *   get:
 *     summary: List diamond packages (Get more diamonds)
 *     description: Lists the purchasable diamond packages shown on the "Get more diamonds" screen.
 *     tags: [Diamonds]
 *     responses:
 *       200:
 *         description: Available diamond packages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 packages:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/DiamondPackage' }
 */
router.get("/packages", asyncHandler(listPackages));

/**
 * @openapi
 * /diamonds/purchase:
 *   post:
 *     summary: Purchase a diamond package (demo purchase only, no real payment)
 *     description: Credits the user's wallet with the diamonds from the given package and records a purchase transaction. No real payment is processed.
 *     tags: [Diamonds]
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
 * /diamonds/transactions:
 *   get:
 *     summary: List my diamond transaction history
 *     description: Returns a paginated history of the user's diamond transactions (purchases, call deductions, gifts sent, signup bonus).
 *     tags: [Diamonds]
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
