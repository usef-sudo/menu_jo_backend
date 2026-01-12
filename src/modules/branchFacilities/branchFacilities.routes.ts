import { Router } from "express";
import { BranchFacilitiesController } from "./branchFacilities.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/branches/{branchId}/facilities:
 *   post:
 *     summary: Assign facilities to a branch
 *     tags: [Branch Facilities]
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
 *               - facilityIds
 *             properties:
 *               facilityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: List of facility IDs to assign
 *     responses:
 *       204:
 *         description: Facilities assigned successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/:branchId/facilities", authMiddleware, BranchFacilitiesController.assign);

/**
 * @swagger
 * /api/branches/{branchId}/facilities/{facilityId}:
 *   delete:
 *     summary: Unassign a facility from a branch
 *     tags: [Branch Facilities]
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
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Facility ID
 *     responses:
 *       204:
 *         description: Facility unassigned successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/:branchId/facilities/:facilityId", authMiddleware, BranchFacilitiesController.unassign);

export default router;