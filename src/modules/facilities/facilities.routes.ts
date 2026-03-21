import { Router } from "express";
import { FacilitiesController } from "./facilities.controller";
import { authMiddleware, adminMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  FacilitiesController.create,
);

router.get("/", FacilitiesController.list);

router.get("/:id", FacilitiesController.getOne);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  FacilitiesController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  FacilitiesController.delete,
);

export default router;
