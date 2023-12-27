const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Shorts = require('../models/shorts');

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
  const avatar = req.file;

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
    avatar: filename
  });
  const OTP = generateOTP()
  const verificationToken = new VerificationToken({
    owner: user._id,
    token: OTP
  })
  await verificationToken.save();
  await user.save();
  sendMail(OTP, email, emailTemplate, 'Verify your email account')
  res.json({ success: true, user });
};

exports.userSignIn = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return sendError(res, 'user not found, with the given email!')
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return sendError(res, 'email / Password does not match!')
  if (!user.verified) return sendError(res, 'Please verify the email first!')

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

  res.json({ success: true, user: user, token });
};

exports.verifyEmail = async (req, res) => {
  const { userid, otp } = req.body
  if (!userid || !otp.trim()) return sendError(res, "Invalid Request, missing parameters")
  if (!isValidObjectId(userid)) return sendError(res, "Invalid user id!")
  const user = await User.findById(userid)
  if (!user) return sendError(res, "Sorry, user not found!")
  if (user.verified) return sendError(res, "This account is already verified, Please try to login!")
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
  const { email, otp } = req.body
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
  sendMail(otp, user.email, ResetpassEmailTemplate, "Reset Email")
  res.json({ success: true, message: 'Password reset verification code is sent to your email.', id: user._id })

}


exports.resetPassword = async (req, res) => {
  const { password, userid } = req.body
  const user = await User.findById(userid)
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
  const { description, category } = req.body
  if (!image) {
    return sendErrorRemoveFile(res, "Please choose image")
  }
  if (!videos) {
    return sendErrorRemoveFile(res, "Please choose video")
  }
  let videoArray = []
  videos.map(video => videoArray.push(video.filename))
  const podcast = {
    description: description,
    image: image.filename,
    videos: videoArray,
    category: category
  }
  await User.findByIdAndUpdate(
    { _id: '658716afe7009f4710f70ab3' },
    { podcast: podcast },
    { new: true }
  );
  return res.json({ success: true, message: 'Podcast Reset successfully' })
}


exports.updatePodcastVideos = async (req, res) => {
  const videos = req.files['videos[]'];
  const {userid} = req.body
  if (!videos) {
    return sendErrorRemoveFile(res, "Please choose video")
  }
  const user = await User.findById(userid)
  const filenameArray = []
  videos.map((video) => filenameArray.push(video.filename))
  const podcastOldVideosArray = user.podcast.videos
  const AllVideos = filenameArray.concat(podcastOldVideosArray)
  const userData = await User.findByIdAndUpdate(
    { _id: userid },
    {
      $set: {
        'podcast.videos': AllVideos, // Update the nested property
      },
    },
    { new: true }
  );
  return res.json({ success: true, message: 'Podcast Videos updated successfully', user:userData })
}


exports.deletePodcastVideo = async (req, res) => {
  const {userid, filename} = req.body
  const user = await User.findById(userid)
  const podcastVideos = user.podcast.videos
  removeItemByName(podcastVideos, filename)
  console.log(podcastVideos)
  removeDataFromUploads(filename)
    const userData = await User.findByIdAndUpdate(
      { _id: userid },
      {
        $set: {
          'podcast.videos': podcastVideos, // Update the nested property
        },
      },
      { new: true }
    );
  return res.json({ success: true, message: 'Video deleted successfully!', user:userData })
}

exports.updatePodcastImage = async (req, res) => {
  const avatar = req.file;
  const { oldimage, userid } = req.body
  const ext = avatar.originalname.substr(avatar.originalname.lastIndexOf('.'));
  const filename = `${avatar.originalname.replace(/\s/g, '')}-${req.query.randomId}${ext}`
  removeDataFromUploads(oldimage)
    await User.findByIdAndUpdate(
      { _id: userid },
      {
        $set: {
          'podcast.image': filename, // Update the nested property
        },
      },
      { new: true }
    );
  return res.json({ success: true, message: 'Image updated successfully!' })
}

exports.updatePodcastDescription = async (req, res) => {
  const { description, userid } = req.body
  await User.findByIdAndUpdate(
    { _id: userid },
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
  const { category, userid } = req.body
  await User.findByIdAndUpdate(
    { _id: userid },
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
  const { description, category } = req.body

  if (!short) {
    return sendErrorRemoveFile(res, "Please choose video")
  }
  let videoArray = []
  const podcast = {
    description: description,
    videos: videoArray,
    category: category
  }
  await User.findByIdAndUpdate(
    { _id: '658716afe7009f4710f70ab3' },
    { podcast: podcast },
    { new: true }
  );
  return res.json({ success: true, message: 'Podcast Created successfully' })



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

exports.updateProfileImage = async (req, res) => {
  const avatar = req.file;
  const { oldimage, userid } = req.body
  const ext = avatar.originalname.substr(avatar.originalname.lastIndexOf('.'));
  const filename = `${avatar.originalname.replace(/\s/g, '')}-${req.query.randomId}${ext}`
  removeDataFromUploads(oldimage)
  const user = await User.findByIdAndUpdate(
    { _id: userid },
    {
      $set: {
        'avatar': filename
      },
    },
    { new: true }
  );
  return res.json({ success: true, message: 'Profile Image updated successfully!', user })
}

exports.updateProfileFullname = async (req, res) => {
  const { fullname, userid } = req.body
  const user = await User.findByIdAndUpdate(
    { _id: userid },
    {
      $set: {
        'fullname': fullname
      },
    },
    { new: true }
  );
  return res.json({ success: true, message: 'Profile Fullname updated successfully!', user })
  // return res.json({ success: false, message: 'Something went wrong!' })
}


// shorts controllers start

exports.GetAllShortVideos = async (req, res) => {
  Shorts.findOne({}, function(err, result) {
    if (err) throw err;
    return res.json({ success: true, shorts: result.shorts })
  })
}


exports.uploadShortVideos = async (req, res) => {
  const video = req.file;
  const { caption, category, userid } = req.body
  const short = {
    userid,
    caption,
    category,
    video:video.filename
  };
  const result = await Shorts.updateOne(
    { /* Your query to identify the document to update */ },
    { $push: { 'shorts': short }, }
  );
  if (result.nModified === 1) {
    return res.json({ success: true, message: 'Short Uploaded successfully!' })
  } else {
    return res.json({ success: false, message: 'Something went wrong!' })
  }
}

exports.updateShortVCategory = async (req, res) => {
  const { category, userid } = req.body
  await User.findByIdAndUpdate(
    { _id: userid },
    {
      $set: {
        'shorts.category': category, // Update the nested property
      },
    },
    { new: true }
  );
  return res.json({ success: true, message: 'Category updated successfully!' })
}

exports.updateShortVCaption = async (req, res) => {
  const { caption, userid } = req.body
  await User.findByIdAndUpdate(
    { _id: userid },
    {
      $set: {
        'shorts.caption': caption, // Update the nested property
      },
    },
    { new: true }
  );
  return res.json({ success: true, message: 'Caption updated successfully!' })
}

// shorts controllers end



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
