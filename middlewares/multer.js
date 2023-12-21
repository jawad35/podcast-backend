const multer = require('multer');

// set storage
var storage = multer.diskStorage({
    destination : function ( req , file , cb ){
        cb(null, 'uploads')
    },
    filename : function (req, file , cb){
        const ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
        cb(null, `${file.originalname}-${req.query.id}${ext}`)
    }
})

module.exports = multer({ storage : storage })