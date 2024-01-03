const mongoose = require('mongoose');

const shortsSchema = new mongoose.Schema({
    shorts:[],
    createdAt: {
        type: Date,
        default: Date.now
      }
})

const Short = mongoose.model('Short', shortsSchema);
Short.createCollection();

module.exports = Short;