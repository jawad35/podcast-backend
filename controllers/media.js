const fs = require('fs');
const Media = require('../models/media');
const path = require('path');
exports.home = async (req, res) => {
    const all_images = await UploadModel.find()
    res.render('main', { images : all_images });
}

exports.AddMedia = (req, res , next) => {
    const files = req.files;
    if(!files){
        const error = new Error('Please choose files');
        error.httpStatusCode = 400;
        return next(error)
    }

    // convert images into base64 encoding
    let imgArray = files.map((file) => {
        let img = fs.readFileSync(file.path)

        return encode_image = img.toString('base64')
    })

    let result = imgArray.map((src, index) => {
        const ext = files[index].originalname.substr(files[index].originalname.lastIndexOf('.'));
        // create object to store data in the collection
        let finalImg = {
        filename : `${files[index].originalname}-${req.query.id}${ext}`,
            contentType : files[index].mimetype,
            imageBase64 : src
        }

        let newUpload = new Media(finalImg);

        return newUpload
                .save()
                .then(() => {
                    return { msg : `${files[index].originalname} Uploaded Successfully...!`}
                })
                .catch(error =>{
                    if(error){
                        if(error.name === 'MongoError' && error.code === 11000){
                            return Promise.reject({ error : `Duplicate ${files[index].originalname}. File Already exists! `});
                        }
                        return Promise.reject({ error : error.message || `Cannot Upload ${files[index].originalname} Something Missing!`})
                    }
                })
    });

    Promise.all(result)
        .then( msg => {
                // res.json(msg);
            res.redirect('/')
        })
        .catch(err =>{
            res.json(err);
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