import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";

import { uploadRoot } from "./uploader.service";

/**
 * GET /api/media/* — serve previously uploaded files.
 * Upload endpoints stay under POST /api/upload (and other module upload routes).
 */
export function serveMedia(req: Request, res: Response, next: NextFunction) {
  try {
    // express mounts at /api/media → req.path is "/folder/file.jpg" or "/*"
    const raw = (req.path || "").replace(/^\/+/, "");
    if (!raw || raw.includes("..")) {
      return res.status(400).json({ success: false, message: "Invalid media path" });
    }

    const fullPath = path.resolve(uploadRoot, raw);
    const root = path.resolve(uploadRoot);
    if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
      return res.status(400).json({ success: false, message: "Invalid media path" });
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    return res.sendFile(fullPath);
  } catch (err) {
    return next(err);
  }
}
