exports.VideoFilter = (req, file, cb) => {
    // Accept video files only
    if (!file.originalname.match(/\.(mp4|avi|mkv)$/)) {
        return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
 };

 exports.checkFileSize = async (filePath) => {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    console.log(`Video file size: ${fileSizeInBytes} bytes`);
    return fileSizeInBytes;
 }