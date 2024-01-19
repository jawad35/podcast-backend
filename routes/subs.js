const express = require('express');
const { createSession, getPrices, createSubscription } = require('../controllers/subs');

const router = express.Router();
router.get('/prices', getPrices);
router.get('/create-session', createSession);
router.post('/payment-sheet', createSubscription);


// router.delete('/uploads:filename', RemoveMedia);

module.exports = router;
