import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const commentRouter = Router();

/*
==================================================
CREATE COMMENT
==================================================
สร้าง comment ใหม่ใน table comments
*/
commentRouter.post("/", async (req, res) => {
  try {
    const { post_id, user_id, comment_text } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!post_id || !user_id || !comment_text) {
      return res.status(400).json({
        message: "post_id, user_id, and comment_text are required",
      });
    }

    // ตรวจสอบว่ามี post อยู่จริง
    const postCheck = await connectionPool.query(
      "SELECT id FROM posts WHERE id = $1",
      [Number(post_id)]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // สร้าง comment ใหม่
    const result = await connectionPool.query(
      `
      INSERT INTO comments (post_id, user_id, comment_text, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [Number(post_id), user_id, comment_text]
    );

    return res.status(201).json({
      message: "Comment created successfully",
      comment: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not create comment because database connection failed",
    });
  }
});

/*
==================================================
GET COMMENTS BY POST ID
==================================================
ดึง comments ตาม post_id
*/
commentRouter.get("/post/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    const result = await connectionPool.query(
      `
      SELECT c.*, u.username, u.profile_pic
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at DESC
      `,
      [postId]
    );

    return res.status(200).json({
      comments: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not fetch comments",
    });
  }
});

/*
==================================================
GET USER INFO BY USER ID
==================================================
ดึง name และ profile_pic ตาม user_id
*/
commentRouter.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await connectionPool.query(
      `
      SELECT username, profile_pic
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not fetch user info",
    });
  }
});

/*
==================================================
DELETE COMMENT
==================================================
ลบ comment ตาม id
*/
commentRouter.delete("/:commentId", async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);

    // ตรวจสอบว่ามี comment อยู่หรือไม่
    const commentCheck = await connectionPool.query(
      "SELECT id FROM comments WHERE id = $1",
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    // ลบ comment
    await connectionPool.query(
      "DELETE FROM comments WHERE id = $1",
      [commentId]
    );

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not delete comment",
    });
  }
});

export default commentRouter;
