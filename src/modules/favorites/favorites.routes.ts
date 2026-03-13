import { Router } from "express";
import { FavoritesController } from "./favorites.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", FavoritesController.list);
router.post("/:restaurantId", FavoritesController.add);
router.delete("/:restaurantId", FavoritesController.remove);

export default router;

