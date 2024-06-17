const { formatDateLabel } = require("../../utils/utils");
const User = require("../../models/userSchema");

const getSearchFiles = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const files = user.files.filter((file) => {
      const fileinLowerCase = file.name.toLowerCase();
      return fileinLowerCase.includes(req.query.query.toLowerCase());
    });

    for (let file of files) {
      file.time = formatDateLabel(file.date);
    }

    return res.status(200).json({ message: "Success", files: files });
  } catch (err) {
    next(err);
  }
};

module.exports = getSearchFiles;
