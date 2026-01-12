// src/routes/upload.routes.ts
import express from 'express';
import { UploadController } from '../uploader/uploader.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import multer from 'multer';
import { uploadService } from "../uploader/uploader.service";
import e from 'express';

export const upload = multer({
  storage: multer.memoryStorage(), // required for S3 upload
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const router = express.Router();

/**
 * @swagger
 * /api/upload/single:
 *   post:
 *     summary: Upload a single file
 *     tags: [Uploader]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               allowedTypes:
 *                 type: string
 *                 description: Comma-separated list of allowed MIME types (optional)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     mimetype:
 *                       type: string
 *                     size:
 *                       type: integer
 *       400:
 *         description: No file uploaded or invalid file type
 */
router.post(
  "/single",
  authMiddleware,
  uploadService.uploadSingle("file"),  // Multer middleware here
  UploadController.uploadSingle
);

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Uploader]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       mimetype:
 *                         type: string
 *                       size:
 *                         type: integer
 *       400:
 *         description: No files uploaded
 */
router.post(
  "/multiple",
  authMiddleware,
  uploadService.uploadMultiple("files", 10),  // Multer middleware here
  UploadController.uploadMultiple
);

/**
 * @swagger
 * /api/upload:
 *   delete:
 *     summary: Delete a file
 *     tags: [Uploader]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: Full URL of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: File URL is required
 *       500:
 *         description: Failed to delete file
 */
router.delete(
  "/",
  authMiddleware,
  UploadController.deleteFile
);

export default router;