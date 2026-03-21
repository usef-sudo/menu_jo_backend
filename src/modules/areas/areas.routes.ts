import { Router } from "express";
import { AreasController } from "./areas.controller";
import { authMiddleware, adminMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  AreasController.create,
);

router.get("/", AreasController.list);

router.get("/:id", AreasController.getOne);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  AreasController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  AreasController.delete,
);

export default router;
