import { Router } from "express";
import { VotesController } from "./vote.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router({ mergeParams: true });
/**
 * @swagger
 * /api/votes/branches/{branchId}/vote:
 *   post:
 *     summary: Vote for a branch
 *     tags: [Votes]
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
 *               - vote
 *             properties:
 *               vote:
 *                 type: integer
 *                 enum: [1, -1]
 *                 description: 1 for upvote, -1 for downvote
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/branches/:branchId/vote", authMiddleware, VotesController.vote);

/**
 * @swagger
 * /api/votes/branches/{branchId}/votes:
 *   get:
 *     summary: Get vote counts for a branch
 *     tags: [Votes]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Vote counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 upVotes:
 *                   type: integer
 *                   description: Total upvotes
 *                 downVotes:
 *                   type: integer
 *                   description: Total downvotes
 */
router.get("/branches/:branchId/votes", VotesController.counts); // Public route

export default router;