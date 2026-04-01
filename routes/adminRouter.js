// server/routes/admin.js
import express from "express";
import { supabase } from "../supabase.js";
import { authMiddleware } from "../middlewares/auth.mjs";

const router = express.Router();

// 🔹 GET profile
router.get("/profile", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(400).json({ error });

  if (data.role !== "admin") {
    return res.status(403).json({ error: "Not admin" });
  }

  res.json(data);
});

// 🔹 UPDATE profile
router.put("/profile", authMiddleware, async (req, res) => {
  const { name, bio, profile_pic } = req.body;

  const { data, error } = await supabase
    .from("users")
    .update({ name, bio, profile_pic })
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
});

export default router;