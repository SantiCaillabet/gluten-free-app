const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp, gif)'));
};

const restaurantUpload = multer({
  storage: createStorage('restaurants'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const recipeUpload = multer({
  storage: createStorage('recipes'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { restaurantUpload, recipeUpload };
