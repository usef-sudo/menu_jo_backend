import { Request, Response, NextFunction } from "express";
import { uploadService } from "../uploader/uploader.service";

export const UploadController = {
  async uploadSingle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // Optional allowedTypes
      if (req.body.allowedTypes) {
        let allowedTypes: string[] = [];
        try {
          allowedTypes = JSON.parse(req.body.allowedTypes);
        } catch {
          allowedTypes = req.body.allowedTypes.split(",").map((t: string) => t.trim());
        }

        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: uploadService.getPublicUrl(req.file as Express.MulterS3.File),
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.MulterS3.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
      }

      const data = files.map(file => ({
        url: uploadService.getPublicUrl(file),
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));

      return res.status(200).json({
        success: true,
        message: `${files.length} file(s) uploaded successfully`,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ success: false, message: "File URL is required" });

      const success = await uploadService.deleteFile(url);
      if (!success) return res.status(500).json({ success: false, message: "Failed to delete file" });

      return res.status(200).json({ success: true, message: "File deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
};
