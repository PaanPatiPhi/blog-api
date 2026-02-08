// api/index.mjs
import express from "express";
import "dotenv/config";
import cors from "cors";
import connectionPool from "../utils/db.mjs";

const app = express();

app.use(express.json());
app.use(cors({ /* config เดิมของนาย */ }));

app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

app.get("/posts", async (req, res) => {
  const results = await connectionPool.query("SELECT * FROM posts");
  res.json({ data: results.rows });
});

export default app;
