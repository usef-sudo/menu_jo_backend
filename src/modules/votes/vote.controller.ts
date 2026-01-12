import { Request, Response, NextFunction } from "express";
import { VotesService } from "./vote.service";

// Define a custom type for authenticated requests
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        // Add other user properties as needed
      };
    }
  }
}

export const VotesController = {
  async vote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id; 
      
      if (!userId) {
        return res.status(401).json({ 
          message: "Unauthorized",
          error: "User authentication required"
        });
      }
      
      const { branchId } = req.params;
      const { vote } = req.body;
      
      // Validate input
      if (!branchId) {
        return res.status(400).json({ 
          message: "Bad Request",
          error: "Branch ID is required"
        });
      }
      
      if (vote === undefined || vote === null) {
        return res.status(400).json({ 
          message: "Bad Request",
          error: "Vote value is required"
        });
      }
      
      // Convert vote to number if it's a string
      const voteNum = Number(vote);
      
      // Validate vote value
      if (isNaN(voteNum) || (voteNum !== 1 && voteNum !== -1)) {
        return res.status(400).json({ 
          message: "Bad Request",
          error: "Vote must be 1 or -1"
        });
      }
      
      const result = await VotesService.vote(userId, branchId, voteNum);
      return res.status(200).json({
        message: "Vote recorded successfully",
        data: result
      });
    } catch (err: any) { 
      // Handle specific errors
      if (err.message?.includes("Vote must be")) {
        return res.status(400).json({
          message: "Bad Request",
          error: err.message
        });
      }
      next(err); 
    }
  },

  async counts(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      
      if (!branchId) {
        return res.status(400).json({ 
          message: "Bad Request",
          error: "Branch ID is required"
        });
      }
      
      const result = await VotesService.counts(branchId);
      return res.status(200).json({
        message: "Vote counts retrieved successfully",
        data: result
      });
    } catch (err) { 
      next(err); 
    }
  },
  
  // Optional: Get user's vote for a specific branch
  async getUserVote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { branchId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ 
          message: "Unauthorized",
          error: "User authentication required"
        });
      }
      
      if (!branchId) {
        return res.status(400).json({ 
          message: "Bad Request",
          error: "Branch ID is required"
        });
      }
      
      const vote = await VotesService.getUserVote(userId, branchId);
      return res.status(200).json({
        message: "User vote retrieved successfully",
        data: vote
      });
    } catch (err) { 
      next(err); 
    }
  },
  
  // Optional: Remove user's vote
  async removeVote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { branchId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ 
          message: "Unauthorized",
          error: "User authentication required"
        });
      }
      
      if (!branchId) {
        return res.status(400).json({ 
          message: "Bad Request",
          error: "Branch ID is required"
        });
      }
      
      const result = await VotesService.removeVote(userId, branchId);
      return res.status(200).json({
        message: "Vote removed successfully",
        data: result
      });
    } catch (err) { 
      next(err); 
    }
  }
};