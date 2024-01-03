const multer = require('multer');

// set storage
var storage = multer.diskStorage({
    destination : function ( req , file , cb ){
        console.log(req)
        cb(null, 'uploads')
    },
    filename : function (req, file , cb){
        const ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
        cb(null, `http://207.180.232.109:8003/uploads/${file.originalname.replace(/\s/g, '')}-${req.query.randomId}${ext}`)
    }
})

module.exports = multer({ storage : storage })