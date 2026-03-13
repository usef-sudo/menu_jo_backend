import express from "express";
import { RestaurantPhotosController } from "./restaurantPhotos.controller";
import {
  authMiddleware,
  adminMiddleware,
} from "../../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /api/restaurants/{restaurantId}/photos:
 *   get:
 *     summary: Get photos for a restaurant
 *     tags: [Restaurant Photos]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter active photos only
 *     responses:
 *       200:
 *         description: List of restaurant photos
 */
router.get(
  "/restaurants/:restaurantId/photos",
  RestaurantPhotosController.getByRestaurant,
);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/photos:
 *   post:
 *     summary: Add a photo to a restaurant
 *     tags: [Restaurant Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
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
 *               caption:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Restaurant photo created successfully
 */
router.post(
  "/restaurants/:restaurantId/photos",
  authMiddleware,
  adminMiddleware,
  RestaurantPhotosController.create,
);

/**
 * @swagger
 * /api/restaurant-photos/{id}:
 *   put:
 *     summary: Update a restaurant photo
 *     tags: [Restaurant Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant photo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *               caption:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Restaurant photo updated successfully
 */
router.put(
  "/restaurant-photos/:id",
  authMiddleware,
  adminMiddleware,
  RestaurantPhotosController.update,
);

/**
 * @swagger
 * /api/restaurant-photos/{id}:
 *   delete:
 *     summary: Delete a restaurant photo
 *     tags: [Restaurant Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant photo ID
 *     responses:
 *       200:
 *         description: Restaurant photo deleted successfully
 */
router.delete(
  "/restaurant-photos/:id",
  authMiddleware,
  adminMiddleware,
  RestaurantPhotosController.delete,
);

export default router;

