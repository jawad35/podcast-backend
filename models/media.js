const mongoose = require('mongoose');

const mediasSchema = new mongoose.Schema({
    filename : {
        type : String,
        unique : true,
        required: true
    },
    contentType : {
        type: String,
        required : true
    },
    imageBase64 : {
        type : String,
        required: true
    }
})

module.exports = mongoose.model('Media', mediasSchema);