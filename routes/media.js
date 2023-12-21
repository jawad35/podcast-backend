const express = require('express');
const store = require('../middlewares/multer')
const { MediaController } = require('../controllers/media');

const router = express.Router();
router.post('/podcast', store.array('images'), MediaController);


module.exports = router;
