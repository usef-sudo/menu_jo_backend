// src/modules/menuImages/menuImage.routes.ts
import express from "express";
import { MenuImagesController } from "./menuImage.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /api/branches/{branchId}/menu-images:
 *   get:
 *     summary: Get menu images for a branch
 *     tags: [Menu Images]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter active images only
 *     responses:
 *       200:
 *         description: List of menu images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       imageUrl:
 *                         type: string
 *                       displayOrder:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 */
router.get("/branches/:branchId/menu-images", MenuImagesController.getByBranch);

/**
 * @swagger
 * /api/branches/{branchId}/menu-images:
 *   post:
 *     summary: Add a menu image to a branch
 *     tags: [Menu Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image
 *               displayOrder:
 *                 type: integer
 *                 description: Sort order
 *     responses:
 *       201:
 *         description: Menu image added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/branches/:branchId/menu-images", authMiddleware, MenuImagesController.upload);

/**
 * @swagger
 * /api/branches/{branchId}/menu-images/batch:
 *   post:
 *     summary: Add multiple menu images to a branch
 *     tags: [Menu Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - imageUrl
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                     displayOrder:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Menu images added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/branches/:branchId/menu-images/batch", authMiddleware, MenuImagesController.uploadMultiple);

/**
 * @swagger
 * /api/menu-images/{id}:
 *   put:
 *     summary: Update a menu image
 *     tags: [Menu Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Menu Image ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Menu image updated successfully
 *       404:
 *         description: Menu image not found
 *       401:
 *         description: Unauthorized
 */
router.put("/menu-images/:id", authMiddleware, MenuImagesController.update);

/**
 * @swagger
 * /api/menu-images/{id}:
 *   delete:
 *     summary: Delete a menu image
 *     tags: [Menu Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Menu Image ID
 *     responses:
 *       200:
 *         description: Menu image deleted successfully
 *       404:
 *         description: Menu image not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/menu-images/:id", authMiddleware, MenuImagesController.delete);

/**
 * @swagger
 * /api/branches/{branchId}/menu-images/reorder:
 *   post:
 *     summary: Reorder menu images for a branch
 *     tags: [Menu Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageIds
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of image IDs in desired order
 *     responses:
 *       200:
 *         description: Menu images reordered successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/branches/:branchId/menu-images/reorder", authMiddleware, MenuImagesController.reorder);

export default router;