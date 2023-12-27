const fs = require('fs');
const Media = require('../models/shorts');
const path = require('path');
const { sendErrorRemoveFile } = require('../helper/ErrorMessage');
exports.home = async (req, res) => {
    const all_images = await UploadModel.find()
    res.render('main', { images: all_images });
}

exports.AddMedia = (req, res, next) => {
    const file1 = req.files['avatar'][0];
    const file2 = req.files['videos[]'];
    console.log(file2)
    return
    const { description, category } = req.body
    if (!file1) {
        return sendErrorRemoveFile(res, "Please choose image")
    }

    if (!file2) {
        return sendErrorRemoveFile(res, "Please choose video")
    }

    const ext = file1.originalname.substr(file1.originalname.lastIndexOf('.'));
    // create object to store data in the collection
    let finalImg = {
        filename: `${file1.originalname}-${req.query.id}${ext}`,
    }

    let newUpload = new Media(finalImg);

    return newUpload
        .save()
        .then(() => {
            return { msg: `${file1.originalname} Uploaded Successfully...!` }
        })
        .catch(error => {
            if (error) {
                if (error.name === 'MongoError' && error.code === 11000) {
                    return Promise.reject({ error: `Duplicate ${file1.originalname}. File Already exists! ` });
                }
                return Promise.reject({ error: error.message || `Cannot Upload ${file1.originalname} Something Missing!` })
            }
        })
}

exports.RemoveMedia = async (req, res) => {
    try {
        const filename = 'reels podcast.mp4-1703182279411.mp4';
        // Remove the file from the upload folder
        // Remove the image record from MongoDB
        //   const fileExists = await fs.access(`./uploads/${filename}`).then(() => true).catch(() => false);

        console.log(fs.existsSync(`./uploads/${filename}`))

        return
        const deletedImage = await Media.findOneAndRemove({ filename });
        fs.unlinkSync(`./uploads/${filename}`);

        if (!deletedImage) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};