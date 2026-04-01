import { Router } from "express";
import protectAdmin from "../middlewares/protectAdmin.mjs";
import { authMiddleware } from "../middlewares/auth.mjs";

const testRouter = Router();

// Test basic authentication
testRouter.get("/auth", authMiddleware, async (req, res) => {
  return res.status(200).json({
    message: "Authentication successful",
    user: req.user
  });
});

// Test admin authentication
testRouter.get("/admin", protectAdmin, async (req, res) => {
  return res.status(200).json({
    message: "Admin authentication successful",
    user: req.user
  });
});

export default testRouter;
