import { Router } from "express";
import { FacilitiesController } from "./facilities.controller";

const router = Router();
/**
 * @swagger
 * /api/facilities:
 *   post:
 *     summary: Create a new facility
 *     tags: [Facilities]
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
 *                 description: English name of the facility
 *               nameAr:
 *                 type: string
 *                 description: Arabic name of the facility
 *               icon:
 *                 type: string
 *                 description: Icon name or URL
 *     responses:
 *       201:
 *         description: Facility created successfully
 *       400:
 *         description: Validation error
 */
router.post("/", FacilitiesController.create);

/**
 * @swagger
 * /api/facilities:
 *   get:
 *     summary: List all facilities
 *     tags: [Facilities]
 *     responses:
 *       200:
 *         description: List of facilities
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
 *                   icon:
 *                     type: string
 */
router.get("/", FacilitiesController.list);
export default router;
