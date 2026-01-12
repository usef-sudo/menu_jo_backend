import { Router } from "express";
import { RestaurantCategoriesController } from "./restaurantCategories.controller";

const router = Router({ mergeParams: true });
router.post("/:restaurantId/assign", RestaurantCategoriesController.assign);
router.delete("/:restaurantId/:categoryId", RestaurantCategoriesController.unassign);
export default router;
