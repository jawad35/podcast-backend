const express = require('express');
const store = require('../middlewares/multer')
const { AddMedia, RemoveMedia } = require('../controllers/media');

const router = express.Router();
router.post('/uploads', store.array('images'), AddMedia);
router.delete('/uploads:filename', RemoveMedia);



module.exports = router;
