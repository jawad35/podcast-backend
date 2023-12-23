const mongoose = require('mongoose');

const mediasSchema = new mongoose.Schema({
    filename : {
        type : String,
        unique : true,
        required: true
    },
    description : {
        type : String,
        required: true
    },
    image:String,
    videos:[],
    createdAt: {
        type: Date,
        default: Date.now
      },
    query:String,

})

module.exports = mongoose.model('Media', mediasSchema);