const mongoose = require('mongoose');

const shortsSchema = new mongoose.Schema({
    shorts:[],
    createdAt: {
        type: Date,
        default: Date.now
      },
    query:String,

})

module.exports = mongoose.model('Short', new mongoose.Schema({
  // your schema here
  shortsSchema
 }));