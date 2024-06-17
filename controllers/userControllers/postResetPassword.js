const jwt = require("jsonwebtoken");
const User = require("../../models/userSchema");

const postResetPassword = async (req, res, next) => {
  try {
    const { _id, token } = req.params;

    const { password } = req.body;

    const user = await User.findOne({ _id: _id });

    if (!user) return res.status(404).json({ message: "User not found" });

    const tempSecret = process.env.JWT_SECRET + user.hash;

    const payload = jwt.verify(token, tempSecret);

    if (!payload) return res.status(401).json({ message: "Invalid authorization token" });

    const hash = await hashPassword(password, 10);

    user.hash = hash;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

module.exports = postResetPassword;
