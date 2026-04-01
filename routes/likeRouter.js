import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const likeRouter = Router();

/*
==================================================
GET LIKES COUNT
==================================================
ดูจำนวนไลค์ของ post
*/
likeRouter.get("/posts/:postId/likes/count", async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    const result = await connectionPool.query(
      "SELECT COUNT(*) as count FROM likes WHERE post_id = $1",
      [postId]
    );

    return res.status(200).json({
      count: Number(result.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not fetch likes count",
    });
  }
});

/*
==================================================
GET USER LIKE STATUS
==================================================
ดูว่า user ไลค์ post นี้หรือไม่
*/
likeRouter.get("/posts/:postId/likes/user/:userId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.params.userId;

    const result = await connectionPool.query(
      "SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2) as liked",
      [postId, userId]
    );

    return res.status(200).json({
      liked: result.rows[0].liked,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not check like status",
    });
  }
});

/*
==================================================
TOGGLE LIKE
==================================================
กดไลค์/ยกเลิกไลค์ post (toggle)
*/
likeRouter.post("/posts/:postId/likes", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id is required",
      });
    }

    // ตรวจสอบว่ามี post อยู่จริง
    const postCheck = await connectionPool.query(
      "SELECT id FROM posts WHERE id = $1",
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // Toggle like (check if exists, then either delete or insert)
    const existingLike = await connectionPool.query(
      "SELECT * FROM likes WHERE post_id = $1 AND user_id = $2",
      [postId, user_id]
    );

    let isLiked;

    if (existingLike.rows.length > 0) {
      // Like exists - delete it (unlike)
      await connectionPool.query(
        "DELETE FROM likes WHERE post_id = $1 AND user_id = $2",
        [postId, user_id]
      );
      isLiked = false;
    } else {
      // Like doesn't exist - insert it (like)
      await connectionPool.query(
        "INSERT INTO likes (post_id, user_id) VALUES ($1, $2)",
        [postId, user_id]
      );
      isLiked = true;
    }

    return res.status(200).json({
      message: isLiked ? "Post liked" : "Post unliked",
      liked: isLiked,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not toggle like",
    });
  }
});

export default likeRouter;
