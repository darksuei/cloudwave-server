const Storage = require("../../services/storage");
const User = require("../../models/userSchema");

const postUploadAvatar = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const folder = Storage.getInstance().storage.root.children.find(
      (folder) => folder.name === req.user.email
    );

    for (const file of req.files) {
      const status = await Storage.getInstance().uploadToStorage(
        file.originalname + "_avatar",
        file.path,
        folder
      );

      if (!status) return res.status(400).json({ message: "Error uploading Avatar" });

      await User.findOneAndUpdate(
        { email: req.user.email },
        { avatar: file.originalname + "_avatar" },
        { new: true }
      )
        .then((updatedUser) => {
          if (updatedUser) {
            console.log("User updated successfully");
          } else {
            console.log("User not found or not updated.");
          }
        })
        .catch((error) => {
          console.error("Error updating user");
        });

      if (status) res.status(201).json({ message: "Files uploaded successfully" });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = postUploadAvatar;
