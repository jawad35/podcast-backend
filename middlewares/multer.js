const multer = require('multer');

// set storage
var storage = multer.diskStorage({
    destination : function ( req , file , cb ){
        cb(null, 'uploads')
    },
    filename : function (req, file , cb){
        cb(null, file.originalname + '-' + Date.now())
    }
})

module.exports = multer({ storage : storage })