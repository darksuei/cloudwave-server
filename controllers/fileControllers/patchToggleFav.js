const User = require("../../models/userSchema");

const patchToggleFav = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const fileToUpdate = user.files.find((file) => file.name === req.params.name);

    if (!fileToUpdate) return res.status(404).json({ message: "File not found" });

    const newIsFavoriteValue = !fileToUpdate.isFavorite;

    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email, "files.name": req.params.name },
      { $set: { "files.$.isFavorite": newIsFavoriteValue } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "Error updating file" });

    return res.status(200).json({ message: "File updated successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = patchToggleFav;
