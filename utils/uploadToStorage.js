
const fs = require('fs');
const { storage } = require('./loginToStorage');

const uploadToStorage = async () => {
    // Read the image file
const imagePath = './download.jpeg';

fs.readFile(imagePath, (error, imageContent) => {
  if (error) {
    console.error('Error reading image:', error);
    return;
  }

  storage.upload('image.jpg', imageContent, (err, file) => {
    if (err) {
      console.error('Error uploading image:', err);
      return;
    }
    console.log('The image was uploaded!', file);
  });
});
}

const shareFile = async () => {
    const file = Object.values(storage.files).find(file => file.name === 'image.jpg')
    const link = await file.link();
    file ? console.log(link) : console.log('File not found');
};

const deleteFile = async () => {
    const file = Object.values(storage.files).find(file => file.name === 'image.jpg')
    file ? file.delete() : console.log('File not found');
};


module.exports = uploadToStorage;