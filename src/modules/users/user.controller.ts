import { Request, Response, NextFunction } from "express";
import { UsersService, CreateUserDTO } from "../users/user.service";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_DAYS = 30;

function signAccessToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}

export const UsersController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as {
        name?: string;
        email?: string;
        password?: string;
        birthDate?: string;
        gender?: string;
        phoneNumber?: string;
      };

      if (
        !body.email ||
        !body.password ||
        !body.birthDate ||
        !body.gender ||
        !body.phoneNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            "email, password, birthDate, gender and phoneNumber are required",
        });
      }

      const dto: CreateUserDTO = {
        name: body.name,
        email: body.email,
        password: body.password,
        birthDate: body.birthDate,
        gender: body.gender,
        phoneNumber: body.phoneNumber,
      };

      const user = await UsersService.create(dto);
      return res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit || 50);
      const offset = Number(req.query.offset || 0);
      const rows = await UsersService.list(limit, offset);
      return res.json(rows);
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Check credentials via service
      const user = await UsersService.validateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const accessToken = signAccessToken(user);
      const refreshToken = crypto.randomUUID();
      const expiresAt = new Date(
        Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
      );
      await UsersService.createRefreshToken(user.id, refreshToken, expiresAt);

      return res.json({
        token: accessToken, // backwards compatibility
        accessToken,
        refreshToken,
        role: user.role,
      });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as { email?: string };
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // For now we don't expose whether the email exists to avoid account enumeration.
      // In a future iteration, generate a reset token and send an email.
      const user = await UsersService.findByEmail(email);
      if (user) {
        console.log(`[forgot-password] Requested for user ${user.id} (${user.email})`);
      }

      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link will be sent.",
      });
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      const result = await UsersService.rotateRefreshToken(refreshToken);
      if (!result) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
        });
      }

      const accessToken = signAccessToken(result.user);

      return res.status(200).json({
        token: accessToken,
        accessToken,
        refreshToken: result.refreshToken,
        role: result.user.role,
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      await UsersService.revokeRefreshToken(refreshToken);

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
