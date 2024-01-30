const express = require('express');
const { createSession, getPrices, createSubscription } = require('../controllers/subs');

const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();
router.get('/prices', getPrices);
router.get('/create-session', createSession);
router.post('/payment-sheet', createSubscription);

router.post('/compress', upload.single('short'), (req, res) => {
    console.log(req.file)
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
  
    const mimeType = req.file.mimetype;
  
    if (mimeType.includes('image')) {
      // If it's an image, compress using sharp
      compressImage(req.file.buffer)
        .then((compressedBuffer) => {
          // Handle the compressed image buffer (save to disk, send as a response, etc.)
          res.send('Image compression successful.');
        })
        .catch((err) => {
          console.error('Image Compression Error:', err);
          res.status(500).send('Internal Server Error');
        });
    } else if (mimeType.includes('video')) {
      // If it's a video, compress using fluent-ffmpeg
      compressVideo(req.file.buffer)
        .then(() => {
          // Handle the compressed video (save to disk, send as a response, etc.)
          res.send('Video compression successful.');
        })
        .catch((err) => {
          console.error('Video Compression Error:', err);
          res.status(500).send('Internal Server Error');
        });
    } else {
      res.status(400).send('Unsupported file type.');
    }
  });
  
  function compressImage(imageBuffer) {
    return sharp(imageBuffer)
      .resize({ width: 800 }) // Adjust the width based on your requirements
      .toBuffer();
  }
  
  function compressVideo(videoBuffer) {
    return new Promise((resolve, reject) => {
        ffmpeg()
          .input(videoBuffer)
          .inputFormat('mp4') // Adjust this based on the input video format
          .videoCodec('libx264')
          .audioCodec('aac')
          .toFormat('mp4')
          .on('end', () => resolve(ffmpeg().stream('output.mp4')))
          .on('error', (err) => reject(err))
          .saveToFile('output.mp4');
      });
  }
  



// router.delete('/uploads:filename', RemoveMedia);

module.exports = router;
