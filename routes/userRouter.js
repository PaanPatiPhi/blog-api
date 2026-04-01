import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const userRouter = Router();

/*
==================================================
GET USER ROLE
==================================================
ดู role ของ user ตาม userId
*/
userRouter.get("/:userId/role", async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await connectionPool.query(
      `
      SELECT role
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
      role: result.rows[0].role,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server could not fetch user role",
    });
  }
});

export default userRouter;
