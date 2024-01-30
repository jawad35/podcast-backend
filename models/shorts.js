const mongoose = require('mongoose');

const shortsSchema = new mongoose.Schema({
    userid: {
      type: String,
      default: null,
      required: true
    },
    category: {
      type: String,
      default: null,
      required: true
    },
    caption: {
      type: String,
      default: null,
      required: true
    },
    video: {
      type: String,
      default: null,
      required: true
    },
    thumbnail: {
      type: String,
      default: null,
      required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
      }
})

const Short = mongoose.model('Short', shortsSchema);
Short.createCollection();

module.exports = Short;