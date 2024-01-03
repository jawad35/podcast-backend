const mongoose = require('mongoose');

const shortsSchema = new mongoose.Schema({
    shorts:[
      {
        userid:'',
        caption:'',
        category:'',
        video: `http://207.180.232.109:8003/uploads/`,
        createdAt:Date.now()
      }
    ],
    createdAt: {
        type: Date,
        default: Date.now
      }
})

const Short = mongoose.model('Short', shortsSchema);
Short.createCollection();

module.exports = Short;