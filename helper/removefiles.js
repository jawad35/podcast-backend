const fs = require('fs');

exports.RemoveFiles = (filename) => {
    fs.unlinkSync(`./uploads/${filename}`)
}