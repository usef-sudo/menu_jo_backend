import { Request, Response } from "express";
import { pool } from "../../config/db";

export const HealthController = {
  /** Liveness: process is up (no dependency checks). */
  live(_req: Request, res: Response) {
    res.json({
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
    });
  },

  /** Readiness: database reachable. */
  async ready(_req: Request, res: Response) {
    try {
      const client = await pool.connect();
      try {
        await client.query("SELECT 1");
      } finally {
        client.release();
      }
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({
        status: "not_ready",
        message: "database unavailable",
      });
    }
  },
};
