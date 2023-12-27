const express = require('express');
const store = require('../middlewares/multer')
const { AddMedia, RemoveMedia } = require('../controllers/media');

const router = express.Router();
router.post('/upload-shorts', store.single('shorts'), AddMedia);
// router.delete('/uploads:filename', RemoveMedia);



module.exports = router;
