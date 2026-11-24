import { Router } from "express";
import { requireAuth, requireUserAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadUserImage } from "../config/upload";
import { getMe, updateMe, getUserById } from "../controllers/user.controller";

const router = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get my profile
 *     description: Returns the authenticated user's own profile.
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
 *                 totalFavorites: { type: integer, description: "Number of partners the user has favorited" }
 */
router.get("/me", requireUserAuth, asyncHandler(getMe));

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Edit my profile
 *     description: Updates one or more of the authenticated user's editable profile fields. Omitted fields are left unchanged.
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               age: { type: number, minimum: 18 }
 *               bio: { type: string }
 *               avatarUrl: { type: string }
 *               image: { type: string, format: binary, description: "Profile image file - uploaded and stored, served back as imageUrl" }
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
router.patch("/me", requireUserAuth, uploadUserImage.single("image"), asyncHandler(updateMe));

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user's public profile (e.g. a partner looking up who's calling/chatting)
 *     description: Returns another user's public profile by id. Accessible to any authenticated actor (user or partner).
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
router.get("/:id", requireAuth, asyncHandler(getUserById));

export default router;
