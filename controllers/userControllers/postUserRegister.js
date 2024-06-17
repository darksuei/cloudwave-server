const jwt = require("jsonwebtoken");
const User = require("../../models/userSchema");
const Storage = require("../../services/storage");

const postUserRegister = async (req, res, next) => {
  try {
    const { email, password, ...rest } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) return res.status(400).json({ message: "Please use a valid email format!" });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered, login to continue!" });
    }

    const minPasswordLength = 6;

    if (password.length < minPasswordLength)
      return res.status(400).json({
        message: `Password must be at least ${minPasswordLength} characters long!`,
      });

    const hash = await hashPassword(password, 10);

    const jwtToken = generateToken(email);

    const verifyJWT = jwt.verify(jwtToken, process.env.JWT_SECRET);

    if (!verifyJWT) return res.status(401).json({ message: "Invalid authorization token." });

    const newUser = new User({
      ...rest,
      email,
      hash,
      token: jwtToken,
    });

    if (await Storage.getInstance().createStorage(newUser.email)) {
      newUser.storage = newUser.email;
      newUser.hasStorage = true;
    }

    await newUser.save();

    return res.status(201).json({ message: "User created successfully", token: newUser.token });
  } catch (err) {
    next(err);
  }
};

module.exports = postUserRegister;
