const User = require("../../models/userSchema");

const getSingleFile = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const file = user.files.find((file) => file.name === req.params.name);

    if (!file) return res.status(404).json({ message: "File not found" });

    return res.status(200).json({ message: "Success", file: file });
  } catch (err) {
    next(err);
  }
};

module.exports = getSingleFile;
