import { Router } from "express";
import { OffersController } from "./offers.controller";
import { authMiddleware, adminMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  OffersController.create,
);

/** Active offers only (public). */
router.get("/", OffersController.list);

/** All offers including expired (admin). */
router.get("/all", authMiddleware, adminMiddleware, OffersController.listAll);

router.get("/:id", OffersController.getOne);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  OffersController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  OffersController.delete,
);

export default router;
