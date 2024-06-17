const Storage = require("../../services/storage");
const { getCategoryFromFileName, linkHash } = require("../../utils/utils");
const User = require("../../models/userSchema");

const postUploadFile = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const folder = Storage.getInstance().storage.root.children.find(
      (folder) => folder.name === req.user.email
    );

    for (const file of req.files) {
      if (user.spaceUsed + file.size / 1024 > 3 * 1024 * 1024) {
        return res.status(400).json({
          message: "Failed",
          error: "Storage limit Exceeded",
        });
      }

      const userFile = await user.files.find((existingFile) => existingFile.name === file.originalname);

      if (userFile) {
        return res.status(409).json({ message: "File already exists" });
      }

      console.log("Uploading...");

      let status = await Storage.getInstance().uploadToStorage(file.originalname, file.path, folder);

      if (!status) return res.status(400).json({ message: "Error uploading file" });

      if (status) res.status(201).json({ message: "Files uploaded successfully" });

      try {
        const link = process.env.CLIENT_URL + "/preview/" + (await linkHash(file.originalname));

        const autoDownloadLink =
          process.env.SERVER_URL + "/api/downloadfile/" + (await linkHash(file.originalname));

        const data = await status.downloadBuffer();

        const dataBase64 = data.toString("base64");

        await User.findOneAndUpdate(
          { email: req.user.email },
          {
            $push: {
              files: {
                name: file.originalname,
                date: new Date(),
                category: getCategoryFromFileName(file.originalname),
                size: file.size / 1024,
                isFavorite: false,
                link: link,
                autoDownloadLink: autoDownloadLink,
                base64: dataBase64,
              },
            },

            $inc: { spaceUsed: file.size / 1024 },
          },
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
            console.error("Error updating user:", error);
          });
      } catch (err) {
        console.error(err);
      }
    }
  } catch (err) {
    next(err);
  }
};

module.exports = postUploadFile;
