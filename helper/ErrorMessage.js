const fs = require('fs');
exports.sendError = (res, error, status = 401) => {
    res.json({success:false, error})
}
exports.sendErrorRemoveFile = (res, error,filename, status = 401) => {
    fs.unlinkSync(`./uploads/${filename}`)
    res.status(status).json({success:false, error})
}