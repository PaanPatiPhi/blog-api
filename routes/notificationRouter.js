import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const notificationRouter = Router();

/*
==================================================
GET NOTIFICATIONS
==================================================
ดึง notifications ทั้งหมด หรือตาม recipient_id พร้อมรายละเอียด article และ comment
*/
notificationRouter.get("/", async (req, res) => {
  try {
    const { recipient_id } = req.query;
    
    let query = `
      SELECT 
        n.*,
        u.username,
        u.profile_pic,
        CASE 
          WHEN n.type = 'comment' THEN p.title
          WHEN n.type = 'like' THEN p.title
          ELSE NULL
        END as article_title,
        CASE 
          WHEN n.type = 'comment' THEN p.id
          WHEN n.type = 'like' THEN p.id
          ELSE NULL
        END as article_id,
        CASE 
          WHEN n.type = 'comment' THEN c.comment_text
          ELSE NULL
        END as comment_content
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN posts p ON (
        (n.type = 'like' AND n.related_id = p.id) OR
        (n.type = 'comment' AND EXISTS (
          SELECT 1 FROM comments c2 
          WHERE c2.id = n.related_id 
          AND c2.post_id = p.id
        ))
      )
      LEFT JOIN comments c ON (n.type = 'comment' AND n.related_id = c.id)
    `;
    let params = [];
    
    if (recipient_id) {
      query += ` WHERE n.recipient_id = $1`;
      params.push(recipient_id);
    }
    
    query += ` ORDER BY n.created_at DESC`;

    const result = await connectionPool.query(query, params);

    return res.status(200).json({
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not fetch notifications",
    });
  }
});

/*
==================================================
POST NOTIFICATIONS
==================================================
สร้าง notification ใหม่
- type: 'comment' (ต้องมี comment_id)
- type: 'like' (ต้องมี post_id)
*/
notificationRouter.post("/", async (req, res) => {
  try {
    const { recipient_id, sender_id, type, comment_id, post_id } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!recipient_id || !sender_id || !type) {
      return res.status(400).json({
        message: "recipient_id, sender_id, and type are required",
      });
    }

    let message = "";
    let related_id = null;

    // สร้าง message ตามประเภท
    if (type === 'comment') {
      if (!comment_id) {
        return res.status(400).json({
          message: "comment_id is required for comment notifications",
        });
      }
      
      // ดึงข้อมูล comment และ post title
      const commentResult = await connectionPool.query(
        `
        SELECT c.comment_text, p.title, u.username
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
        `,
        [comment_id]
      );

      if (commentResult.rows.length === 0) {
        return res.status(404).json({
          message: "Comment not found",
        });
      }

      const comment = commentResult.rows[0];
      message = `${comment.username} commented on your post "${comment.title}": "${comment.comment_text}"`;
      related_id = comment_id;

    } else if (type === 'like') {
      if (!post_id) {
        return res.status(400).json({
          message: "post_id is required for like notifications",
        });
      }
      
      // ดึงข้อมูล post title
      const postResult = await connectionPool.query(
        "SELECT title FROM posts WHERE id = $1",
        [post_id]
      );

      if (postResult.rows.length === 0) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      const post = postResult.rows[0];
      message = `Someone liked your post "${post.title}"`;
      related_id = post_id;

    } else {
      return res.status(400).json({
        message: "Invalid notification type. Must be 'comment' or 'like'",
      });
    }

    // สร้าง notification
    const result = await connectionPool.query(
      `
      INSERT INTO notifications (recipient_id, sender_id, type, message, related_id, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [recipient_id, sender_id, type, message, related_id]
    );

    return res.status(201).json({
      message: "Notification created successfully",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not create notification",
    });
  }
});

/*
==================================================
PATCH NOTIFICATION READ
==================================================
ทำ notification เป็นอ่านแล้วตาม id
*/
notificationRouter.patch("/:id/read", async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    // ตรวจสอบว่ามี notification อยู่หรือไม่
    const notificationCheck = await connectionPool.query(
      "SELECT id FROM notifications WHERE id = $1",
      [notificationId]
    );

    if (notificationCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    // อัปเดตเป็นอ่านแล้ว
    await connectionPool.query(
      "UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1",
      [notificationId]
    );

    return res.status(200).json({
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not update notification",
    });
  }
});

/*
==================================================
PATCH ALL NOTIFICATIONS READ
==================================================
ทำ notifications ทั้งหมดเป็นอ่านแล้ว
*/
notificationRouter.patch("/read-all", async (req, res) => {
  try {
    const { recipient_id } = req.body;

    if (!recipient_id) {
      return res.status(400).json({
        message: "recipient_id is required",
      });
    }

    const result = await connectionPool.query(
      "UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE recipient_id = $1 AND is_read = false",
      [recipient_id]
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      updatedCount: result.rowCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not update notifications",
    });
  }
});

export default notificationRouter;
