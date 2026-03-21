import { Router } from "express";
import { RestaurantCategoriesController } from "./restaurantCategories.controller";
import { authMiddleware, adminMiddleware } from "../../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.post(
  "/:restaurantId/assign",
  authMiddleware,
  adminMiddleware,
  RestaurantCategoriesController.assign,
);
router.delete(
  "/:restaurantId/:categoryId",
  authMiddleware,
  adminMiddleware,
  RestaurantCategoriesController.unassign,
);
export default router;
