import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import protectAdmin from "../middlewares/protectAdmin.mjs";

const categoryRouter = Router();

categoryRouter.get("/", async (req, res) => {
  try {
    const results = await connectionPool.query(
      `select * from categories ORDER BY id ASC;`,
    );
    console.log(results);
    if (results.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Server could not find a requested post" });
    }
    return res.status(200).json(results.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server could not read post because database connection",
    });
  }
});

categoryRouter.get("/:categoryId", async (req, res) => {
  try {
    const categoryIdFromClient = Number(req.params.categoryId);
    const results = await connectionPool.query(
      `select * from categories where id = $1`,
      [categoryIdFromClient],
    );
    console.log(results);
    if (results.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Server could not find a requested category" });
    }
    return res.status(200).json(results.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server could not read category because database connection",
    });
  }
});

categoryRouter.post("/", protectAdmin, async (req, res) => {
  try {
    // รับข้อมูลจาก request body
    const { name } = req.body;

    await connectionPool.query(
      `
      INSERT INTO categories
      (name)
      VALUES ($1)
      `,
      [name],
    );

    return res.status(201).json({
      message: "Created category successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Server could not create category because database connection failed",
    });
  }
});

categoryRouter.put("/:categoryId", protectAdmin, async (req, res) => {
  try {
    const categoryIdFromClient = Number(req.params.categoryId);

    // ตรวจสอบว่ามี post อยู่หรือไม่
    const hasFound = await connectionPool.query(
      `
      SELECT *
      FROM categories
      WHERE id = $1
      `,
      [categoryIdFromClient],
    );
    console.log(hasFound)
    if (hasFound.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested category to update",
      });
    }

    const { name } = req.body;
    console.log(name)
    // update ข้อมูล
    await connectionPool.query(
      `
      UPDATE categories
      SET
        name = COALESCE($1, name)
      WHERE id = $2
      `,
      [name ?? null, categoryIdFromClient],
    );

    return res.status(200).json({
      message: "Updated category successfully",
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: "Server could not update category because database connection",
    });
  }
});

categoryRouter.delete("/:categoryId", protectAdmin, async (req, res) => {
  try {
    const categoryIdFromClient = Number(req.params.categoryId);

    // ตรวจสอบว่ามี post อยู่หรือไม่
    const hasFound = await connectionPool.query(
      `
      SELECT *
      FROM categories
      WHERE id = $1
      `,
      [categoryIdFromClient]
    );

    if (hasFound.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested category to delete",
      });
    }

    // ลบ post
    await connectionPool.query(
      `
      DELETE FROM categories
      WHERE id = $1
      `,
      [categoryIdFromClient]
    );

    return res.status(200).json({
      message: "Deleted category successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not delete category because database connection",
    });
  }
});


export default categoryRouter;
