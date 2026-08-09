import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

import { PUBLIC_BASE_URL, UPLOAD_DIR } from "../../config/env";

/** Public path prefix for serving files (download). Upload POSTs stay on /api/upload. */
export const MEDIA_URL_PREFIX = "/api/media";

const uploadRoot = path.isAbsolute(UPLOAD_DIR)
  ? UPLOAD_DIR
  : path.resolve(process.cwd(), UPLOAD_DIR);

fs.mkdirSync(uploadRoot, { recursive: true });

export interface UploadOptions {
  folder?: string;
  allowedMimeTypes?: string[];
  maxFileSize?: number;
}

function publicUrlForRelativeKey(relativeKey: string): string {
  const pathPart = `${MEDIA_URL_PREFIX}/${relativeKey.replace(/^\/+/, "")}`;
  const base = PUBLIC_BASE_URL.replace(/\/+$/, "");
  return base ? `${base}${pathPart}` : pathPart;
}

export class UploadService {
  private static instance: UploadService;

  static getInstance() {
    if (!UploadService.instance) UploadService.instance = new UploadService();
    return UploadService.instance;
  }

  getUploadMiddleware(options: UploadOptions = {}) {
    const {
      folder = "uploads",
      allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ],
      maxFileSize = 5 * 1024 * 1024,
    } = options;

    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dest = path.join(uploadRoot, folder);
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (_req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
      },
    });

    return multer({
      storage,
      limits: { fileSize: maxFileSize },
      fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
        else
          cb(
            new Error(
              `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
            ),
          );
      },
    });
  }

  uploadSingle(fieldName: string, options?: UploadOptions) {
    return this.getUploadMiddleware(options).single(fieldName);
  }

  uploadMultiple(fieldName: string, maxCount = 10, options?: UploadOptions) {
    return this.getUploadMiddleware(options).array(fieldName, maxCount);
  }

  /** Relative key under upload root (e.g. uploads/uuid.jpg). */
  getRelativeKey(file: Express.Multer.File): string {
    const rel = path.relative(uploadRoot, file.path);
    return rel.split(path.sep).join("/");
  }

  getPublicUrl(file: Express.Multer.File): string {
    return publicUrlForRelativeKey(this.getRelativeKey(file));
  }

  async deleteFile(fileUrl: string) {
    try {
      let pathname: string;
      try {
        pathname = new URL(fileUrl).pathname;
      } catch {
        pathname = fileUrl;
      }

      // Prefer /api/media/...; also accept legacy /uploads/... paths.
      let relativeKey: string | null = null;
      for (const marker of [`${MEDIA_URL_PREFIX}/`, "/uploads/"]) {
        const idx = pathname.indexOf(marker);
        if (idx !== -1) {
          relativeKey = pathname.slice(idx + marker.length);
          break;
        }
      }
      if (!relativeKey || relativeKey.includes("..")) return false;

      const fullPath = path.join(uploadRoot, relativeKey);
      const resolved = path.resolve(fullPath);
      if (
        !resolved.startsWith(path.resolve(uploadRoot) + path.sep) &&
        resolved !== path.resolve(uploadRoot)
      ) {
        return false;
      }

      if (fs.existsSync(resolved)) {
        await fs.promises.unlink(resolved);
      }
      return true;
    } catch (error) {
      console.error("Error deleting local upload:", error);
      return false;
    }
  }
}

export const uploadService = UploadService.getInstance();
export { uploadRoot };
