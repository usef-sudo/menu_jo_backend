import { Router } from "express";
import { OffersController } from "./offers.controller";

const router = Router();
/**
 * @swagger
 * /api/offers:
 *   post:
 *     summary: Create a new offer
 *     tags: [Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - title
 *             properties:
 *               restaurantId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the restaurant
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Offer created successfully
 *       400:
 *         description: Validation error
 */
router.post("/", OffersController.create);

/**
 * @swagger
 * /api/offers:
 *   get:
 *     summary: List all offers
 *     tags: [Offers]
 *     responses:
 *       200:
 *         description: List of offers
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
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 */
router.get("/", OffersController.list);
export default router;
