const express = require('express');
const store = require('../middlewares/multer')
const { AddMedia, RemoveMedia } = require('../controllers/media');

const router = express.Router();
router.post('/uploads', store.fields([{ name: 'avatar', maxCount: 1 }, { name: 'videos[]'}]), AddMedia);
router.delete('/uploads:filename', RemoveMedia);



module.exports = router;
