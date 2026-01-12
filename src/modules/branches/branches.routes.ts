import { Router } from "express";
import { BranchesController } from "./branches.controller";

const router = Router();

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: Create a new branch
 *     tags: [Branches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - nameEn
 *               - nameAr
 *             properties:
 *               restaurantId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the restaurant
 *               areaId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the area
 *               nameEn:
 *                 type: string
 *                 description: English name of the branch
 *               nameAr:
 *                 type: string
 *                 description: Arabic name of the branch
 *               address:
 *                 type: string
 *               latitude:
 *                 type: string
 *               longitude:
 *                 type: string
 *               costLevel:
 *                 type: integer
 *                 description: Cost level (1-5)
 *               isOpen:
 *                 type: integer
 *                 description: 1 for open, 0 for closed
 *     responses:
 *       201:
 *         description: Branch created successfully
 *       400:
 *         description: Validation error
 */
router.post("/", BranchesController.create);

/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: List all branches
 *     tags: [Branches]
 *     responses:
 *       200:
 *         description: List of branches
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
 *                   address:
 *                     type: string
 *                   isOpen:
 *                     type: integer
 */
router.get("/", BranchesController.list);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Get a branch by ID
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 nameEn:
 *                   type: string
 *                 nameAr:
 *                   type: string
 *                 address:
 *                   type: string
 *                 isOpen:
 *                   type: integer
 *                 upVotes:
 *                   type: integer
 *                 downVotes:
 *                   type: integer
 *       404:
 *         description: Branch not found
 */
router.get("/:id", BranchesController.getOne);

export default router;