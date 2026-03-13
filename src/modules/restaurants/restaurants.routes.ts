import { Router } from "express";
import { RestaurantsController } from "./restaurants.controller";

const router = Router();

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nameEn
 *               - nameAr
 *             properties:
 *               nameEn:
 *                 type: string
 *                 description: English name of the restaurant
 *               nameAr:
 *                 type: string
 *                 description: Arabic name of the restaurant
 *               logoUrl:
 *                 type: string
 *                 description: URL of the restaurant logo
 *               descriptionEn:
 *                 type: string
 *                 description: English description
 *               descriptionAr:
 *                 type: string
 *                 description: Arabic description
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *       400:
 *         description: Validation error
 */
router.post("/", RestaurantsController.create);

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: List all restaurants
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: List of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   nameEn:
 *                     type: string
 *                   nameAr:
 *                     type: string
 *                   logoUrl:
 *                     type: string
 *                   phone:
 *                     type: string
 */
router.get("/", RestaurantsController.list);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details
 *       404:
 *         description: Restaurant not found
 */
router.get("/:id", RestaurantsController.getOne);

/**
 * @swagger
 * /api/restaurants/{id}/details:
 *   get:
 *     summary: Get full restaurant details including branches and facilities
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details with aggregates
 *       404:
 *         description: Restaurant not found
 */
router.get("/:id/details", RestaurantsController.getDetails);

export default router;