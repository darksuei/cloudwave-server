const Router = require("express").Router;

const { getCategoryCount, getAllFiles, getFilesByCategory, getStorage, searchFiles, uploadFile, deleteFile, renameFile, favorites } = require('../controllers/filesController');

const filesRouter = Router();

const multer = require('multer');

const upload = multer({ dest: "utils/public" });

const { authenticate } = require('../utils/authenticate');

filesRouter.get('/search', authenticate, searchFiles);

filesRouter.get('/files', authenticate, getAllFiles);

filesRouter.get('/files/:name', authenticate, getFilesByCategory);

filesRouter.get('/file/count', authenticate, getCategoryCount);

filesRouter.post('/upload', authenticate, upload.array("files"), uploadFile);

filesRouter.delete('/delete/:name', authenticate, deleteFile);

filesRouter.patch('/rename:name', authenticate, renameFile);

filesRouter.get('/favorites', favorites);

filesRouter.get('/storage',authenticate, getStorage)

module.exports = filesRouter;

