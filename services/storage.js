const fs = require("fs");
const path = require("path");
const { Storage: MegaStorage } = require("megajs");

module.exports = class Storage {
  storage = null;
  _instance = null;
  _storageConfig = {
    email: process.env.MEGA_USER,
    password: process.env.MEGA_PASS,
    userAgent: "null",
  };

  constructor() {
    this.storage = new MegaStorage(this._storageConfig);
    this.loginToStorage();
  }

  static getInstance = () => {
    if (!this._instance) {
      this._instance = new Storage();
    }
    return this._instance;
  };

  loginToStorage = async () => {
    try {
      await this.storage.ready;
      console.log("Succesfully connected to storage.");
    } catch (error) {
      console.error("Failed to connect to storage.", error.message);
    }
  };

  createStorage = async (id) => {
    try {
      await storage.mkdir(id);

      return true;
    } catch (err) {
      console.error(err);

      return false;
    }
  };

  uploadToStorage = (name, filepath, folder) => {
    let imagePath;

    if (filepath) imagePath = path.join(__dirname, filepath.slice(8));

    if (!folder) return;

    return new Promise((resolve, reject) => {
      fs.readFile(imagePath, async (err, imageContent) => {
        if (err) {
          console.error("Error reading file:", err);
          return reject(err);
        }

        folder.upload(name, imageContent, (err, file) => {
          if (err) {
            console.error("Error uploading file:", err);
            return reject(err);
          }
          resolve(file);
        });

        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
            return reject(err);
          }
        });
      });
    });
  };

  getStorageFiles = async (folder) => {
    try {
      const list = [];

      const files = await folder.children;

      if (!files) return false;

      for (let i = 0; i < files.length; i++) {
        if (!files[i]) break;

        list.push(files[i].name);
      }

      return list;
    } catch (err) {
      console.error(err);

      return false;
    }
  };

  getStorageFilesinDetail = async (folder) => {
    try {
      const list = [];

      const files = await folder.children;

      if (!files) return false;

      for (let i = 0; i < files.length; i++) {
        if (!files[i]) break;
        list.push(files[i]);
      }

      return list;
    } catch (err) {
      console.error(err);

      return false;
    }
  };

  shareFile = async () => {
    const file = Object.values(storage.files).find((file) => file.name === "image.jpg");

    const link = await file.link();

    file ? console.log(link) : console.error("File not found");
  };

  deleteFile = async () => {
    const file = Object.values(storage.files).find((file) => file.name === "image.jpg");

    file ? file.delete() : console.error("File not found");
  };
};
