const Storage = require("../../services/storage");
const User = require("../../models/userSchema");

const patchRenameFile = async (req, res, next) => {
  try {
    const folder = Storage.getInstance().storage.root.children.find(
      (folder) => folder.name === req.user.email
    );

    const filelist = await Storage.getInstance().getStorageFilesinDetail(folder);

    const file = filelist.find((file) => file.name === req.params.name);

    file.rename(req.body.newName);

    const filter = {
      email: req.user.email,
      "files.name": req.params.name,
    };

    const update = {
      $set: {
        "files.$.name": req.body.newName,
      },
    };

    const user = await User.findOneAndUpdate(filter, update, { new: true });

    if (!user) return res.status(404).json({ message: "User or file not found" });

    return res.status(200).json({ message: "Success" });
  } catch (error) {
    next(error);
  }
};

module.exports = patchRenameFile;
