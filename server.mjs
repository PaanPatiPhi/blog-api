import app from "./api/index.mjs";

const port = process.env.PORT || 4002;
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
