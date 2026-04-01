import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import  verifyToken  from "../middlewares/verifyToken.js";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const meRouter = Router();

const multerUpload = multer({ storage: multer.memoryStorage() });
// กำหนดฟิลด์ที่จะรับไฟล์ (สามารถรับได้หลายฟิลด์)
const imageFileUpload = multerUpload.fields([
  { name: "imageFile", maxCount: 1 },
]);

meRouter.get("/profile", verifyToken, async (req, res) => {
 try{ 

const userId = req.user.sub;
    // const userId = req.params.id
  const result = await connectionPool.query(
    "SELECT * FROM users WHERE id = $1",
    [userId]
  );

  res.status(200).json(result.rows[0]);}
  catch(error){
    console.log(error)
    return res.status(500).json({
        message:"Server could not read user profile because database connection"
    })
  }
});

meRouter.put("/profile", [verifyToken, imageFileUpload], async (req, res) => {
  try {
    const userId = req.user.sub;
    const file = req.files?.imageFile?.[0];
    const { username, name } = req.body;

    const bucketName = "pics";

    if (!username && !name && !file) {
      return res.status(400).json({
        message: "No data provided for update"
      });
    }

    let publicUrl = null;

    if (file) {
      const filePath = `profile/${Date.now()}_${file.originalname}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw error;

      publicUrl = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path).data.publicUrl;
    }

    const result = await connectionPool.query(
      `
      UPDATE users
      SET 
        username = COALESCE($1, username),
        name = COALESCE($2, name),
        profile_pic = COALESCE($3, profile_pic),
        role = $4
      WHERE id = $5
      RETURNING *
      `,
      [username, name, publicUrl, "user", userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "Update profile successfully"
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server could not update profile",
      error: error.message,
    });
  }
});


export default meRouter