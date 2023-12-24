const jwt = require('jsonwebtoken');
const User = require('../models/user');
const sharp = require('sharp');
const VerificationToken = require('../models/verificationToken');
const generateOTP = require('../utils/generateOTP');
const sendMail = require('../utils/sendMails');
const { sendError, sendErrorRemoveFile } = require('../helper/ErrorMessage');
const { isValidObjectId } = require('mongoose');
const emailTemplate = require('../utils/emailTemplate');
const VerifiefSuccessEmailTemplate = require('../utils/verifiefSuccessEmailTemplate');
const { CreateRandomBytes } = require('../helper/createRandombytes');
const ResetpassEmailTemplate = require('../utils/resetpassEmailTemplate');
const resetpassToken = require('../models/resetpassToken');
const ResetPassSuccessTemplate = require('../utils/resetPassSuccess');
const { RemoveFiles } = require('../helper/removefiles');
const { removeItemByName } = require('../helper/ItemRemoveFromArray');
const { removeDataFromUploads } = require('../helper/removeDataFromUploads');
// const cloudinary = require('../helper/imageUpload');
exports.createUser = async (req, res) => {
  const  avatar  = req.file;

  const ext = avatar.originalname.substr(avatar.originalname.lastIndexOf('.'));
  const filename = `${avatar.originalname.replace(/\s/g, '')}-${req.query.randomId}${ext}`
  const { fullname, email, password } = req.body;
  if (!fullname || !email || !password || !avatar) return sendErrorRemoveFile(res, "Please Provide all inputs!", filename)
  const isNewUser = await User.isThisEmailInUse(email);
  if (!isNewUser) {
    RemoveFiles(filename)
    return res.json({
      success: false,
      message: 'This email is already in use, try sign-in',
    });
  }
  const user = await User({
    fullname,
    email,
    password,
    avatar:filename
  });
  const OTP = generateOTP()
  const verificationToken = new VerificationToken({
    owner: user._id,
    token: OTP
  })
  await verificationToken.save();
  await user.save();
  // sendMail(OTP, email, emailTemplate, 'Verify your email account')
  res.json({ success: true, user });
};

exports.userSignIn = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)
  const user = await User.findOne({ email });
  if (!user)
    return res.json({
      success: false,
      message: 'user not found, with the given email!',
    });

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.json({
      success: false,
      message: 'email / password does not match!',
    });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  let oldTokens = user.tokens || [];

  if (oldTokens.length) {
    oldTokens = oldTokens.filter(t => {
      const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
      if (timeDiff < 86400) {
        return t;
      }
    });
  }

  await User.findByIdAndUpdate(user._id, {
    tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
  });

  const userInfo = {
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar ? user.avatar : '',
  };

  res.json({ success: true, user: userInfo, token });
};

exports.verifyEmail = async (req, res) => {
  const { userid, otp } = req.body
  console.log(req.body)
  if (!userid || !otp.trim()) return sendError(res, "Invalid Request, missing parameters")
  if (!isValidObjectId(userid)) return sendError(res, "Invalid user id!")
  const user = await User.findById(userid)
  if (!user) return sendError(res, "Sorry, user not found!")
  if (user.verified) return sendError(res, "This account is already verified!")
  const token = await VerificationToken.findOne({ owner: user._id })
  if (!token) return sendError(res, "Sorry, user not found!")
  const isMatched = await token.compareToken(otp)
  if (!isMatched) return sendError(res, "Please provide a valid token!")
  await VerificationToken.findByIdAndDelete(token._id)
  await User.findByIdAndUpdate(
    user._id,
    { verified: true },
    { new: true }
  );
  sendMail(otp, user.email, VerifiefSuccessEmailTemplate, "Welcome Email")
  res.json({ success: true, message: 'Email verified successfully' })
}


exports.forgetPassword = async (req, res) => {
  const { email } = req.body
  if (!email) return sendError(res, "Please provide a valid email")
  const user = await User.findOne({ email })
  if (!user) return sendError(res, "User not found, invalid request!")
  const token = await resetpassToken.findOne({ owner: user._id })
  if (token) return sendError(res, "Only after one hour you can request for another token")

  const generatedToken = await CreateRandomBytes()

  const resetToken = new resetpassToken({ owner: user._id, token: generatedToken })
  await resetToken.save()
  // await resetpassToken.findByIdAndUpdate(
  //  { owner:user._id},
  //   { token: generatedToken },
  //   { new: true }
  // );
  const url = `http://localhost:3000/reset-password?token=${generatedToken}&id=${user._id}`
  sendMail(url, user.email, ResetpassEmailTemplate, "Reset Email")
  res.json({ success: true, message: 'Password reset link is sent to your email.' })

}


exports.resetPassword = async (req, res) => {
  const { password } = req.body
  const user = await User.findById(req.user._id)
  if (!user) return sendError(res, "User not found, invalid request!")
  const isSamePass = await user.comparePassword(password)
  if (isSamePass) return sendError(res, "New password must be different!")
  // if (password.trim().length < 8 || password.trim().length > 20 ) return sendError(res, "Password must be 8 to 20 characters long!")
  user.password = password.trim()
  user.save()

  await resetpassToken.findOneAndDelete({ owner: user._id })
  sendMail(null, user.email, ResetPassSuccessTemplate, "Password Reset successfully")
  res.json({ success: true, message: 'Password Reset successfully' })

}

exports.uploadPodcast = async (req, res) => {
  const image = req.files['avatar'][0];
  const videos = req.files['videos[]'];
  const { description, category  } = req.body
  if (!image) {
      return sendErrorRemoveFile(res, "Please choose image")
  }
  if (!videos) {
      return sendErrorRemoveFile(res, "Please choose video")
  }
  let videoArray = []
  videos.map(video => videoArray.push(video.filename))
  const podcast = {
    description:description,
    image:image.filename,
    videos:videoArray,
    category:category
  }
    await User.findByIdAndUpdate(
   { _id:'658716afe7009f4710f70ab3'},
    { podcast: podcast },
    { new: true }
  );
  return res.json({ success: true, message: 'Podcast Reset successfully' })

  

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


exports.updatePodcast = async (req, res) => {
  const id = "658716afe7009f4710f70ab3"
  const description = "updated des"
  const category = "updated cate"
  const podcast = {
    description,
    category
  }
 
}

exports.deletePodcastVideo = async (req, res) => {
  const id = "658716afe7009f4710f70ab3"
  const filename = 'Recorder_18122023_195130.mp4-b9436e45-9ca3-499a-b2be-7a876fac5753.mp4'
  const user = await User.findById(id)
  const podcastVideos = user.podcast.videos
  removeItemByName(podcastVideos, filename)
  const isRemoved = removeDataFromUploads(filename) 
  if (isRemoved) {
    await User.findByIdAndUpdate(
      { _id:'658716afe7009f4710f70ab3'},
      {
        $set: {
          'podcast.videos': podcastVideos, // Update the nested property
        },
      },
       { new: true }
     );
  }
  
  return res.json({ success: true, message: 'Video deleted successfully!' })
}

exports.updatePodcastImage = async (req, res) => {
  const  avatar  = req.file;
  const {oldimage} = req.body
  const ext = avatar.originalname.substr(avatar.originalname.lastIndexOf('.'));
  const filename = `${avatar.originalname.replace(/\s/g, '')}-${req.query.randomId}${ext}`
  const isRemoved = removeDataFromUploads(oldimage) 
  if (isRemoved) {
    await User.findByIdAndUpdate(
      { _id:'658716afe7009f4710f70ab3'},
      {
        $set: {
          'podcast.image': filename, // Update the nested property
        },
      },
       { new: true }
     );
  }
  
  return res.json({ success: true, message: 'Image updated successfully!' })
}

exports.updatePodcastDescription = async (req, res) => {
  const {description} = req.body
  console.log(description)
  return
    await User.findByIdAndUpdate(
      { _id:'658716afe7009f4710f70ab3'},
      {
        $set: {
          'podcast.description': description, // Update the nested property
        },
      },
       { new: true }
     );
  return res.json({ success: true, message: 'Description updated successfully!' })
}

exports.updatePodcastCategory = async (req, res) => {
  const {category} = req.body
  console.log(category)
  return
    await User.findByIdAndUpdate(
      { _id:'658716afe7009f4710f70ab3'},
      {
        $set: {
          'podcast.category': category, // Update the nested property
        },
      },
       { new: true }
     );
  return res.json({ success: true, message: 'Description updated successfully!' })
}

exports.uploadShort = async (req, res) => {
  const short = req.files['short'];
  const { description, category  } = req.body

  if (!short) {
      return sendErrorRemoveFile(res, "Please choose video")
  }
  let videoArray = []
  const podcast = {
    description:description,
    videos:videoArray,
    category:category
  }
    await User.findByIdAndUpdate(
   { _id:'658716afe7009f4710f70ab3'},
    { podcast: podcast },
    { new: true }
  );
  return res.json({ success: true, message: 'Podcast Reset successfully' })

  

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

// exports.signOut = async (req, res) => {
//   if (req.headers && req.headers.authorization) {
//     const token = req.headers.authorization.split(' ')[1];
//     if (!token) {
//       return res
//         .status(401)
//         .json({ success: false, message: 'Authorization fail!' });
//     }

//     const tokens = req.user.tokens;

//     const newTokens = tokens.filter(t => t.token !== token);

//     await User.findByIdAndUpdate(req.user._id, { tokens: newTokens });
//     res.json({ success: true, message: 'Sign out successfully!' });
//   }
// };
