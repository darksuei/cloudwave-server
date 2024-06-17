const User = require("../../models/userSchema");
const Storage = require("../../services/storage");

const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const folder = Storage.getInstance().storage.root.children.find(
      (folder) => folder.name === req.user.email
    );

    const filelist = await Storage.getInstance().getStorageFilesinDetail(folder);

    if (!filelist) return res.status(200).json({ message: "success", user });

    const fileToSend = filelist.find((file) => file.name === user.avatar);

    if (!fileToSend) return res.status(200).json({ message: "success", user });

    const data = await fileToSend.downloadBuffer();

    const dataBase64 = data.toString("base64");

    return res.status(200).json({ message: "success", user, dataBase64 });
  } catch (error) {
    next(error);
  }
};

module.exports = getUser;
