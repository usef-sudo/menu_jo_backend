import { Router } from "express";
import { BranchesController } from "./branches.controller";
import { authMiddleware, adminMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: Create a new branch
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  BranchesController.create,
);

/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: List all branches
 *     tags: [Branches]
 */
router.get("/", BranchesController.list);

/**
 * @swagger
 * /api/branches/nearby:
 *   get:
 *     summary: List nearby branches
 *     tags: [Branches]
 */
router.get("/nearby", BranchesController.listNearby);

/**
 * @swagger
 * /api/branches/{id}/opening-hours:
 *   put:
 *     summary: Replace weekly opening hours (admin)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id/opening-hours",
  authMiddleware,
  adminMiddleware,
  BranchesController.replaceOpeningHours,
);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Get a branch by ID
 *     tags: [Branches]
 */
router.get("/:id", BranchesController.getOne);

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: Update branch (admin)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  BranchesController.update,
);

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     summary: Delete branch (admin)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  BranchesController.delete,
);

export default router;
