const express = require('express');
const { createSubscription, getPrices } = require('../controllers/subs');

const router = express.Router();
router.get('/prices', getPrices);
router.get('/create-subscription', createSubscription);

// router.delete('/uploads:filename', RemoveMedia);



module.exports = router;
