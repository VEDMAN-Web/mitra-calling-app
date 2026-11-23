import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { getMe, updateMe, getUserById } from "../controllers/user.controller";

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 */
router.get("/me", asyncHandler(getMe));

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Edit my profile
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               age: { type: number, minimum: 18 }
 *               bio: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 */
router.patch("/me", asyncHandler(updateMe));

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get another user's public profile (Discover card detail)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Public profile
 *       404:
 *         description: User not found
 */
router.get("/:id", asyncHandler(getUserById));

export default router;
