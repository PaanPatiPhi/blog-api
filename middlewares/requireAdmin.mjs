const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const userId = data.user.id;

  const profile = await connectionPool.query(
    "select role from users where id = $1 limit 1",
    [userId]
  );

  if (!profile.rows.length || profile.rows[0].role !== "admin") {
    return res.status(403).json({ message: "Not allowed" });
  }

  req.user = data.user;
  next();
};

export default requireAdmin