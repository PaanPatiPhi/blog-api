import express from "express"

const app = express();
const port = 4002;


app.get("/test", (req,res)=>{
    return res.json({message:"Server API IS working"});
});

app.get("/profiles", (req,res)=>{

    try{
        return res.status(200).json({
            
  "data":  {
      "name": "john",
      "age": 20
  }

        });
    }
    catch (error){
        console.log(error);
        return res.status(500).json({
            message: "error"
        });
    };
});


app.listen(port, () => {
  console.log(`🚀 Server is running at ${port}`);
});

