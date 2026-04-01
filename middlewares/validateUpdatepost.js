// middlewares/validateUpdatePost.js
export default function validateUpdatePost(req, res, next) {
  const {
    title,
    image,
    category_id,
    description,
    content,
    status_id,
  } = req.body;

  if (title !== undefined && typeof title !== "string") {
    return res.status(400).json({ message: "title must be a string" });
  }

  if (image !== undefined && typeof image !== "string") {
    return res.status(400).json({ message: "image must be a string" });
  }

  if (category_id !== undefined && typeof category_id !== "number") {
    return res.status(400).json({ message: "category_id must be a number" });
  }

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ message: "description must be a string" });
  }

  if (content !== undefined && typeof content !== "string") {
    return res.status(400).json({ message: "content must be a string" });
  }

  if (status_id !== undefined && typeof status_id !== "number") {
    return res.status(400).json({ message: "status_id must be a number" });
  }

  next();
}
