import { Router } from "express";
import { ReviewsController } from "./reviews.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/branches/:branchId/reviews", ReviewsController.list);
router.post(
  "/branches/:branchId/reviews",
  authMiddleware,
  ReviewsController.upsert,
);

export default router;

