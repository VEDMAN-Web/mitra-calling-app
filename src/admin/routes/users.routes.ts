import { Router } from "express";
import { requireAdmin } from "../../common/middleware/auth";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { uploadUserImage } from "../../config/upload";
import { listUsers, getUser, createUser, updateUser, deleteUser } from "../controllers/users.controller";

const router = Router();
router.use(requireAdmin);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List users
 *     description: Lists users with pagination and optional search (name/phone/email).
 *     tags: [Admin Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get("/users", asyncHandler(listUsers));

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     summary: Get a user by id
 *     tags: [Admin Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get("/users/:id", asyncHandler(getUser));

/**
 * @openapi
 * /admin/users:
 *   post:
 *     summary: Create a user
 *     description: Creates a new, non-guest user record.
 *     tags: [Admin Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               age: { type: number }
 *               bio: { type: string }
 *               diamondBalance: { type: number }
 *               image: { type: string, format: binary, description: "Profile image file - uploaded and stored, served back as imageUrl" }
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: name is required
 *       409:
 *         description: Phone or email already in use
 */
router.post("/users", uploadUserImage.single("image"), asyncHandler(createUser));

/**
 * @openapi
 * /admin/users/{id}:
 *   patch:
 *     summary: Update a user
 *     description: Updates one or more of a user's fields. Omitted fields are left unchanged.
 *     tags: [Admin Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               age: { type: number }
 *               bio: { type: string }
 *               diamondBalance: { type: number }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated user
 *       404:
 *         description: User not found
 *       409:
 *         description: Phone or email already in use
 */
router.patch("/users/:id", uploadUserImage.single("image"), asyncHandler(updateUser));

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", asyncHandler(deleteUser));

export default router;
