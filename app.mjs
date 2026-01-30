import express from "express";
import "dotenv/config";
import connectionPool from "./utils/db.mjs";


const app = express();
const port = 4002;
app.use(express.json());


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

app.post("/posts", async (req, res) => {
  try{
     const { title,image,category_id,description, content, status_id } = req.body;
    if (!title || !image || !category_id || !description || !content || !status_id) {
      return res.status(400).json({
        message: "Server could not create assignment because there are missing data from client" 
      });
    }
   const newPost = {
     ...req.body,
   };
   await connectionPool.query(
     `INSERT INTO posts ( title,image,category_id,description, content, status_id)
	   VALUES ($1, $2, $3, $4, $5, $6)`,
     [
       newPost.title,
       newPost.image,
       newPost.category_id,
       newPost.description,
       newPost.content,
       newPost.status_id,
     ]
   );
   return res.status(201).json({
     message: "Created post successfully",
   });
  }
  catch(error){
    console.log(error)
    return res.status(500).json({ message: "Server could not create assignment because database connection" });
  }
});



app.listen(port, () => {
  console.log(`🚀 Server is running at ${port}`);
});

