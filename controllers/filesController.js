const { storage, loginToStorage } = require("../utils/loginToStorage");

const {
  uploadToStorage,
  getStorageFiles,
  getStorageFilesinDetail,
} = require("../utils/Storage");

const {
  formatDateLabel,
  getCategoryFromFileName,
  getCategoryIcon,
  linkHash,
  deLinkHash,
} = require("../utils/utils");

const errorMiddleware = require("../middleware/errorMiddleware");

require("dotenv").config();

const User = require("../models/userSchema");

const { File } = require("megajs");

const getCategoryCount = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const categories = {
      pictures: 0,
      videos: 0,
      audio: 0,
      documents: 0,
    };

    if (req.query.favorites === "true") {
      for (const file of user.files) {
        if (file.isFavorite) {
          const category = getCategoryFromFileName(file.name);
          if (category in categories) {
            categories[category]++;
          }
        }
      }
    } else {
      for (const file of user.files) {
        const category = getCategoryFromFileName(file.name);
        if (category in categories) {
          categories[category]++;
        }
      }
    }
    return res.status(200).json({ message: "Success", categories });
  } catch (error) {
    next(error);
  }
};

const getFilesByCategory = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    await loginToStorage();
    const folder = storage.root.children.find(
      (folder) => folder.name === req.user.email
    );
    const filelist = await getStorageFiles(folder);
    if (!filelist) return res.status(404).json({ message: "No files found" });

    const files = [];
    for (let i = 0; i < filelist.length; i++) {
      if (user) {
        const fileItem = user.files.find(
          (file) =>
            file.name === filelist[i] &&
            getCategoryFromFileName(file.name) === req.params.name
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

const getAllFiles = async (req, res, next) => {
  try {
    await loginToStorage();
    const folder = storage.root.children.find(
      (folder) => folder.name === req.user.email
    );

    const filelist = await getStorageFiles(folder);
    if (!filelist) return res.status(404).json({ message: "No files found" });

    let files = [];

    const user = await User.findOne({ email: req.user.email });
    if (user) {
      for (let i = 0; i < filelist.length; i++) {
        const fileItem = user.files.find((file) => file.name === filelist[i]);
        if (fileItem && fileItem.name !== user.avatar) {
          const time = fileItem.date;
          files.push({
            id: i,
            name: filelist[i],
            time: formatDateLabel(time),
            isFavorite: fileItem.isFavorite,
            category: fileItem.category,
            icon: getCategoryIcon(fileItem.category),
            base64: fileItem.base64,
            link: fileItem.link,
            autoDownloadLink: fileItem.autoDownloadLink,
          });
        }
      }
    } else {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "Success", files: files });
  } catch (err) {
    next(err);
  }
};

const searchFiles = async (req, res, next) => {
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

const uploadFile = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    await loginToStorage();
    const folder = storage.root.children.find(
      (folder) => folder.name === req.user.email
    );
    for (const file of req.files) {
      if (user.spaceUsed + file.size / 1024 > 3 * 1024 * 1024) {
        return res.status(400).json({
          message: "Failed",
          error: "Storage limit Exceeded",
        });
      }
      const userFile = await user.files.find(
        (existingFile) => existingFile.name === file.originalname
      );
      if (userFile) {
        return res.status(409).json({ message: "File already exists" });
      }
      console.log("Uploading...");

      let status = await uploadToStorage(file.originalname, file.path, folder);
      if (!status)
        return res.status(400).json({ message: "Error uploading file" });

      if (status)
        res.status(201).json({ message: "Files uploaded successfully" });
      try {
        const link =
          process.env.CLIENT_URL +
          "/preview/" +
          (await linkHash(file.originalname));

        const autoDownloadLink =
          process.env.SERVER_URL +
          "/api/downloadfile/" +
          (await linkHash(file.originalname));

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

const getStorage = async (req, res) => {
  const maxStorage = 3;
  const maxStorageKB = maxStorage * 1024 * 1024;

  const user = await User.findOne({ email: req.user.email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const storageUsedKB = Math.round(user.spaceUsed);
  const storageUsedMB = Math.round(storageUsedKB / 1024);
  const storageUsedGB = Math.round(storageUsedKB / (1024 * 1024));
  let percentage = Math.round((storageUsedKB / maxStorageKB) * 100);

  if (storageUsedKB > 0 && storageUsedKB < 52429) {
    percentage = 1;
  }
  if (storageUsedKB > 1024 * 1024) {
    return res.status(200).json({
      message: "Success",
      storageUsed: storageUsedGB,
      unit: "GB",
      percentage,
    });
  } else if (storageUsedKB > 1024) {
    return res.status(200).json({
      message: "Success",
      storageUsed: storageUsedMB,
      unit: "MB",
      percentage,
    });
  }
  return res.status(200).json({
    message: "Success",
    storageUsed: storageUsedKB,
    unit: "KB",
    percentage,
  });
};

const deleteFile = async (req, res, next) => {
  try {
    await loginToStorage();
    const folder = storage.root.children.find(
      (folder) => folder.name === req.user.email
    );
    const filelist = await getStorageFilesinDetail(folder);

    const fileToDelete = filelist.find((file) => file.name === req.params.name);
    fileToDelete.delete();

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const file = user.files.find((file) => file.name === req.params.name);
    if (!file) return res.status(404).json({ message: "File not found" });

    await User.findOneAndUpdate(
      { email: req.user.email },
      { $inc: { spaceUsed: -file.size } }
    );
    user.files.pull(file);
    await user.save();
    return res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    next(err);
  }
};

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

const getFavs = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const favs = user.files.filter((file) => file.isFavorite);
    if (!favs) return res.status(404).json({ message: "No favorites found" });

    favs.map((item) => {
      item.time = formatDateLabel(item.date);
      return item;
    });
    return res.status(200).json({ message: "Success", favs: favs });
  } catch (error) {
    next(error);
  }
};

const toggleFav = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const fileToUpdate = user.files.find(
      (file) => file.name === req.params.name
    );

    if (!fileToUpdate)
      return res.status(404).json({ message: "File not found" });

    const newIsFavoriteValue = !fileToUpdate.isFavorite;

    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email, "files.name": req.params.name },
      { $set: { "files.$.isFavorite": newIsFavoriteValue } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "Error updating file" });
    }
    return res.status(200).json({ message: "File updated successfully" });
  } catch (error) {
    next(error);
  }
};

const renameFile = async (req, res, next) => {
  try {
    await loginToStorage();
    const folder = storage.root.children.find(
      (folder) => folder.name === req.user.email
    );
    const filelist = await getStorageFilesinDetail(folder);
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
    if (!user)
      return res.status(404).json({ message: "User or file not found" });

    return res.status(200).json({ message: "Success" });
  } catch (error) {
    next(error);
  }
};

const getImage = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    const filename = await user.files.find(
      (file) => file.name == req.params.name
    );
    if (!filename) return res.status(404).json({ message: "File not found." });

    await loginToStorage();
    const folder = storage.root.children.find(
      (folder) => folder.name === req.user.email
    );
    const filelist = await getStorageFilesinDetail(folder);

    const fileToSend = filelist.find((file) => file.name === req.params.name);

    const data = await fileToSend.downloadBuffer();

    const dataBase64 = data.toString("base64");

    res.status(200).json({
      message: "Success",
      dataBase64,
      extension: filename.name.split(".").pop(),
    });
  } catch (err) {
    next(err);
  }
};

const getFileFromCrypt = async (req, res, next) => {
  try {
    const filehash = req.params.hash;
    const decryptedFileName = await deLinkHash(filehash);
    const user = await User.findOne({ "files.name": decryptedFileName });
    if (!user) return res.status(404).json({ message: "User not found" });
    const file = await user.files.find(
      (file) => file.name == decryptedFileName
    );
    if (!file) return res.status(404).json({ message: "File not found." });
    file.time = formatDateLabel(file.date);
    res.status(200).json({ message: "Success", file });
  } catch (err) {
    next(err);
  }
};

const getFileFromCryptAndDownload = async (req, res, next) => {
  console.log("hi");
  try {
    const filehash = req.params.hash;
    const decryptedFileName = await deLinkHash(filehash);
    const user = await User.findOne({ "files.name": decryptedFileName });
    if (!user) return res.status(404).json({ message: "User not found" });

    //Get the file from db
    const file = await user.files.find(
      (file) => file.name == decryptedFileName
    );

    //Get the file from storage
    await loginToStorage();
    const folder = storage.root.children.find(
      (folder) => folder.name === user.email
    );

    const filelist = await getStorageFilesinDetail(folder);

    const fileToSend = filelist.find((file) => file.name === decryptedFileName);

    const data = await fileToSend.downloadBuffer();

    if (data) {
      res.setHeader("Content-disposition", "attachment; filename=" + file.name);
      if (file.category == "pictures") {
        res.setHeader("Content-type", "image/jpeg");
      } else if (file.category == "videos") {
        res.setHeader("Content-type", "video/mp4");
      } else if (file.category == "audio") {
        res.setHeader("Content-type", "audio/mp3");
      } else {
        res.setHeader("Content-type", "application/pdf");
      }

      res.end(data);
    } else {
      res.status(404).send("File not found");
    }
  } catch (err) {
    next(err);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    await loginToStorage();
    const folder = storage.root.children.find(
      (folder) => folder.name === req.user.email
    );
    for (const file of req.files) {
      const status = await uploadToStorage(
        file.originalname + "_avatar",
        file.path,
        folder
      );
      if (!status) {
        return res.status(400).json({ message: "Error uploading Avatar" });
      }
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
      if (status)
        res.status(201).json({ message: "Files uploaded successfully" });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllFiles,
  getCategoryCount,
  getFilesByCategory,
  getStorage,
  searchFiles,
  uploadFile,
  deleteFile,
  getFavs,
  toggleFav,
  renameFile,
  getImage,
  getSingleFile,
  getFileFromCrypt,
  getFileFromCryptAndDownload,
  uploadAvatar,
};
