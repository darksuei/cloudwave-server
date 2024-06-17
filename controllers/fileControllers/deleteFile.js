const Storage = require("../../services/storage");
const User = require("../../models/userSchema");

const deleteFile = async (req, res, next) => {
  try {
    const folder = Storage.getInstance().storage.root.children.find(
      (folder) => folder.name === req.user.email
    );

    const filelist = await Storage.getInstance().getStorageFilesinDetail(folder);

    const fileToDelete = filelist.find((file) => file.name === req.params.name);

    if (!fileToDelete) return res.status(404).json({ message: "File not found" });

    fileToDelete.delete();

    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const file = user.files.find((file) => file.name === req.params.name);

    if (!file) return res.status(404).json({ message: "File not found" });

    await User.findOneAndUpdate({ email: req.user.email }, { $inc: { spaceUsed: -file.size } });

    user.files.pull(file);

    await user.save();

    return res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = deleteFile;
