const path = require('path');
const fs = require('fs');

// On startup, read images from frontend/images
const FRONT_IMAGES_DIR = path.join(__dirname, '..', '..', 'frontend', 'images');

function loadImages() {
  try {
    const files = fs.readdirSync(FRONT_IMAGES_DIR);
    // include only png/jpg/jpeg and heart* files if possible
    return files.filter(f => /heart/i.test(f) && /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  } catch (err) {
    console.error('Error reading images dir:', err);
    return [];
  }
}

const images = loadImages();

const randomInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;

exports.getHeart = (req, res) => {
  try {
    if (!images.length) {
      return res.status(500).json({ message: 'No heart images found on server' });
    }
    const idx = Math.floor(Math.random() * images.length);
    const filename = images[idx];
    const imageUrl = `/images/${filename}`; // served statically by server
    const solution = randomInt(1,10);
    const carrots = randomInt(1,10);
    return res.json({ image: imageUrl, solution, carrots });
  } catch (err) {
    return res.status(500).json({ message: 'Error selecting heart', error: String(err) });
  }
};

// Proxy external Heart Game API to avoid CORS issues from browser
const fetcher = require('../utils/fetcher');
exports.getExternal = async (req, res) => {
  try {
    const externalUrl = 'http://marcconrad.com/uob/heart/api.php?out=json&base64=no';
    const r = await fetcher(externalUrl);
    if (!r.ok) {
      return res.status(502).json({ message: 'External Heart API fetch failed' });
    }
    // r.data may be JSON or string; ensure it's an object
    const data = r.data;
    return res.json(data);
  } catch (err) {
    console.error('Error fetching external heart API:', err);
    return res.status(500).json({ message: 'Error fetching external heart API' });
  }
};
