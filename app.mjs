import express from "express";
import "dotenv/config";
import connectionPool from "./utils/db.mjs";
import cors from "cors";
import authRouter from "./routes/auth.js";
import postRouter from "./routes/postRouter.js";
import meRouter from "./routes/me.js";
import categoryRouter from "./routes/categoryRouter.js";
import adminRouter from "./routes/adminRouter.js";
import commentRouter from "./routes/commentRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import likeRouter from "./routes/likeRouter.js";
import userRouter from "./routes/userRouter.js";
import testRouter from "./routes/testRouter.js";

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://personal-blog-react-git-refactor-d99b7b-phis-projects-e10d8e3b.vercel.app",
    "https://personal-blog-react-cyan.vercel.app"
  ]
}));

const port = process.env.PORT || 4002;
app.use(express.json());
app.use("/auth", authRouter)
app.use("/posts", postRouter)
app.use("/me", meRouter)
app.use("/categories", categoryRouter)
app.use("/admin", adminRouter);
app.use("/comments", commentRouter);
app.use("/notifications", notificationRouter);
app.use("/likes", likeRouter);
app.use("/users", userRouter);
app.use("/test", testRouter);


app.get("/test", (req,res)=>{
    return res.json({message:"Server API IS working"});
});

app.get("/profiles", (req, res) => {
  return res.status(200).json({
    data: {
      name: "john",
      age: 20
    }
  });
});



app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

app.get("/api/posts", async (req,res)=>{
  try{
    const results = await connectionPool.query(`SELECT * FROM posts where status_id = '2'`);
    res.status(200).json({
      data: results.rows
    })
  }
  catch(error){
    console.log(error)
    res.status(500).json({
      message: "Server could not fetch posts"
    })
  }
})
app.get("/published", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 6));

    const offset = (page - 1) * limit;

    // ✅ นับเฉพาะ published
    const countResult = await connectionPool.query(
      `SELECT COUNT(*) FROM posts WHERE status_id = '2'`
    );

    const totalPosts = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    const postsResult = await connectionPool.query(
      `
      SELECT *
      FROM posts
      WHERE status_id = '2'
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
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
    console.log(error)

    // res.status(500).json({
    //   message: "Internal server error",
    // });
  }
});



// app.listen(port, () => {
//   console.log(`🚀 Server is running at ${port}`);
// });

export default app