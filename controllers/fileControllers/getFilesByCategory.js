const Storage = require("../../services/storage");
const { formatDateLabel, getCategoryFromFileName } = require("../../utils/utils");
const User = require("../../models/userSchema");

const getFilesByCategory = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const folder = Storage.getInstance().storage.root.children.find(
      (folder) => folder.name === req.user.email
    );

    const filelist = await Storage.getInstance().getStorageFiles(folder);

    if (!filelist) return res.status(404).json({ message: "No files found" });

    const files = [];

    for (let i = 0; i < filelist.length; i++) {
      if (user) {
        const fileItem = user.files.find(
          (file) => file.name === filelist[i] && getCategoryFromFileName(file.name) === req.params.name
        );

        if (fileItem) {
          const time = fileItem.date;
          files.push({
            id: i,
            name: filelist[i],
            time: formatDateLabel(time),
          });
        }
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    }

    return res.status(200).json({ message: "Success", files: files });
  } catch (err) {
    next(err);
  }
};

module.exports = getFilesByCategory;
