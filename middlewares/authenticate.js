const jwt = require("jsonwebtoken");

const authenticate = async (req, res, next) => {
  try {
    const token = await req.headers.authorization.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Invalid token." });

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized." });
  }
};

module.exports = authenticate;
