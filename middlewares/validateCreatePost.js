function validateCreatePost(req, res, next) {
  let {
    title,
    image,
    category_id,
    description,
    content,
    status_id,
  } = req.body;

  const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

  // convert number
  category_id = Number(category_id);
  status_id = Number(status_id);

  if (!isNonEmptyString(title)) {
    return res.status(400).json({
      message: "title is required",
    });
  }

  if (!isNonEmptyString(image)) {
    return res.status(400).json({
      message: "image is required",
    });
  }

  if (!Number.isInteger(category_id)) {
    return res.status(400).json({
      message: "category_id must be integer",
    });
  }

  // description ไม่จำเป็น
  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({
      message: "description must be string",
    });
  }

  if (!isNonEmptyString(content)) {
    return res.status(400).json({
      message: "content is required",
    });
  }

  if (!Number.isInteger(status_id)) {
    return res.status(400).json({
      message: "status_id must be integer",
    });
  }

  // save converted values
  req.body.category_id = category_id;
  req.body.status_id = status_id;

  next();
}

export default validateCreatePost;