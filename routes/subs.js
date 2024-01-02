const express = require('express');
const { getPrices } = require('../controllers/subs');

const router = express.Router();
router.get('/prices', getPrices);
// router.delete('/uploads:filename', RemoveMedia);



module.exports = router;
