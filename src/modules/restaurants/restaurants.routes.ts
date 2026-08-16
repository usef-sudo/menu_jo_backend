import { Router } from "express";
import { RestaurantsController } from "./restaurants.controller";
import { authMiddleware, adminMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
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
 *               nameAr:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               descriptionEn:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  RestaurantsController.create,
);

router.post(
  "/bulk",
  authMiddleware,
  adminMiddleware,
  RestaurantsController.createBulk,
);

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: List all restaurants
 *     tags: [Restaurants]
 */
router.get("/", RestaurantsController.list);

/**
 * @swagger
 * /api/restaurants/{id}/details:
 *   get:
 *     summary: Get full restaurant details including branches and facilities
 *     tags: [Restaurants]
 */
router.get("/:id/details", RestaurantsController.getDetails);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 */
router.get("/:id", RestaurantsController.getOne);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   put:
 *     summary: Update restaurant (admin)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  RestaurantsController.update,
);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   delete:
 *     summary: Delete restaurant (admin)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  RestaurantsController.delete,
);

export default router;
