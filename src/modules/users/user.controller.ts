import { Request, Response, NextFunction } from "express";
import { UsersService } from "../users/user.service";
import jwt from "jsonwebtoken";

export const UsersController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body;
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

      // Sign JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" }
      );

      return res.json({ token });
    } catch (err) {
      next(err);
    }
  },
};
