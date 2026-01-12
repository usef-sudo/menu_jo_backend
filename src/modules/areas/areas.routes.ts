import { Router } from "express";
import { AreasController } from "./areas.controller";

const router = Router();
/**
 * @swagger
 * /api/areas:
 *   post:
 *     summary: Create a new area
 *     tags: [Areas]
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
 *                 description: English name of the area
 *               nameAr:
 *                 type: string
 *                 description: Arabic name of the area
 *     responses:
 *       201:
 *         description: Area created successfully
 *       400:
 *         description: Validation error
 */
router.post("/", AreasController.create);

/**
 * @swagger
 * /api/areas:
 *   get:
 *     summary: List all areas
 *     tags: [Areas]
 *     responses:
 *       200:
 *         description: List of areas
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
 */
router.get("/", AreasController.list);
export default router;
