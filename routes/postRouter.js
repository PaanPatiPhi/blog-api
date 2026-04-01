import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import protectAdmin from "../middlewares/protectAdmin.mjs";
import validateCreatePost from "../middlewares/validateCreatePost.js";
import validateUpdatePost from "../middlewares/validateUpdatepost.js";

const postRouter = Router();

postRouter.get("/published", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 6));
    const offset = (page - 1) * limit;

    const category = req.query.category || "";
    const search = req.query.search || "";

    // ✅ COUNT ต้องใช้เงื่อนไขเดียวกัน
    const countResult = await connectionPool.query(
      `
      SELECT COUNT(*)
      FROM posts
      JOIN categories ON posts.category_id = categories.id
      WHERE posts.status_id = 2
      AND ($1 = '' OR categories.name = $1)
      AND ($2 = '' OR posts.title ILIKE '%' || $2 || '%')
      `,
      [category, search]
    );

    const totalPosts = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    const postsResult = await connectionPool.query(
      `
      SELECT 
        posts.*,
        categories.name AS category_name
      FROM posts
      JOIN categories 
        ON posts.category_id = categories.id
      WHERE posts.status_id = 2
      AND ($3 = '' OR categories.name = $3)
      AND ($4 = '' OR posts.title ILIKE '%' || $4 || '%')
      ORDER BY posts.id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset, category, search]
    );

    const posts = postsResult.rows;

    const nextPage = page < totalPages ? page + 1 : null;

    res.json({
      totalPosts,
      totalPages,
      currentPage: page,
      limit,
      posts,
      nextPage, 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

/*
==================================================
GET POST BY ID
==================================================
ดึง post ตาม id
*/
postRouter.get("/:postId", async (req, res) => {
  try {
    // รับ id จาก params และแปลงเป็น number
    const postIdFromClient = Number(req.params.postId);

    const results = await connectionPool.query(
      `
      SELECT id, image, category_id, title, description, date, content
      FROM posts
      WHERE id = $1
      `,
      [postIdFromClient],
    );

    // ถ้าไม่พบ post
    if (results.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post",
      });
    }

    // ส่ง post กลับไป
    return res.status(200).json(results.rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Server could not read post because database connection",
    });
  }
});

/*
==================================================
CREATE POST
==================================================
React จะส่ง image URL ที่ได้จาก Supabase มา
*/
postRouter.post("/", protectAdmin, validateCreatePost, async (req, res) => {
  try {
    // รับข้อมูลจาก request body
    const { title, image, category_id, description, content, status_id } =
      req.body;

    await connectionPool.query(
      `
      INSERT INTO posts
      (title, image, category_id, description, content, status_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        title,
        image,
        Number(category_id), // แปลงเป็น number
        description,
        content,
        Number(status_id), // แปลงเป็น number
      ],
    );

    return res.status(201).json({
      message: "Created post successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Server could not create post because database connection failed",
    });
  }
});

/*
==================================================
DELETE POST
==================================================
*/
postRouter.delete("/:postId", protectAdmin, async (req, res) => {
  try {
    const postIdFromClient = Number(req.params.postId);

    // ตรวจสอบว่ามี post อยู่หรือไม่
    const hasFound = await connectionPool.query(
      `
      SELECT *
      FROM posts
      WHERE id = $1
      `,
      [postIdFromClient],
    );

    if (hasFound.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to delete",
      });
    }

    // ลบ post
    await connectionPool.query(
      `
      DELETE FROM posts
      WHERE id = $1
      `,
      [postIdFromClient],
    );

    return res.status(200).json({
      message: "Deleted post successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not delete post because database connection",
    });
  }
});

/*
==================================================
UPDATE POST
==================================================
ใช้ COALESCE เพื่อ update เฉพาะ field ที่ส่งมา
*/
postRouter.put(
  "/:postId",
  protectAdmin,
  validateUpdatePost,
  async (req, res) => {
    try {
      const postIdFromClient = Number(req.params.postId);

      // ตรวจสอบว่ามี post อยู่หรือไม่
      const hasFound = await connectionPool.query(
        `
      SELECT *
      FROM posts
      WHERE id = $1
      `,
        [postIdFromClient],
      );

      if (hasFound.rows.length === 0) {
        return res.status(404).json({
          message: "Server could not find a requested post to update",
        });
      }

      const { title, image, category_id, description, content, status_id } =
        req.body;

      // update ข้อมูล
      await connectionPool.query(
        `
      UPDATE posts
      SET
        title       = COALESCE($1, title),
        image       = COALESCE($2, image),
        category_id = COALESCE($3, category_id),
        description = COALESCE($4, description),
        content     = COALESCE($5, content),
        status_id   = COALESCE($6, status_id)
      WHERE id = $7
      `,
        [
          title ?? null,
          image ?? null,
          category_id ? Number(category_id) : null,
          description ?? null,
          content ?? null,
          status_id ? Number(status_id) : null,
          postIdFromClient,
        ],
      );

      return res.status(200).json({
        message: "Updated post successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Server could not update post because database connection",
      });
    }
  },
);

/*
==================================================
GET POSTS (PAGINATION)
==================================================
*/
postRouter.get("/", async (req, res) => {
  try {
    // รับ page และ limit จาก query
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;

    // คำนวณ offset
    const offset = (page - 1) * limit;

    // นับจำนวน post ทั้งหมด
    const countResult = await connectionPool.query(
      `SELECT COUNT(*) FROM posts`,
    );

    const totalPosts = Number(countResult.rows[0].count);

    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalPosts / limit);

    // ดึง post ตาม page
    const postsResult = await connectionPool.query(
      `
      SELECT *
      FROM posts
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    );

    const posts = postsResult.rows;

    // ถ้ามีหน้าถัดไป
    const nextPage = page < totalPages ? page + 1 : null;

    res.json({
      totalPosts,
      totalPages,
      currentPage: page,
      limit,
      posts,
      nextPage,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default postRouter;
