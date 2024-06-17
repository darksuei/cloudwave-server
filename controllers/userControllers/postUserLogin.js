const bcrypt = require("bcrypt");
const User = require("../../models/userSchema");

const postUserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: "Email not registered!" });

    const isPasswordValid = await bcrypt.compare(password, user.hash);

    if (!isPasswordValid) return res.status(401).json({ message: "Incorrect Password!" });

    const newToken = generateToken(user.email);

    user.token = newToken;

    await user.save();

    return res.status(200).json({ message: "Login successful!", token: newToken });
  } catch (err) {
    next(err);
  }
};

module.exports = postUserLogin;
