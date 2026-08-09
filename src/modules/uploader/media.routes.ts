import { Router } from "express";
import { serveMedia } from "./media.controller";

const router = Router();

/**
 * GET /api/media/* — download / serve an uploaded file.
 * Upload POSTs remain on /api/upload (unchanged).
 */
router.get(/(.*)/, serveMedia);

export default router;
