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
const { CreatePayment } = require('../helper/CreatePaymentSheet');
const SubSuccessEmailTemplate = require('../utils/subscriptionEmailTemplate');
const ffmpeg = require('fluent-ffmpeg');
const Short = require('../models/shorts');
// const cloudinary = require('../helper/imageUpload');
exports.createUser = async (req, res) => {
  console.log('jkk')
  // const ext = avatar.originalname.substr(avatar.originalname.lastIndexOf('.'));
  // cons = `${avatar.originalname.replace(/\s/g, '')}-${req.query.randomId}${ext}`
  const { fullname, email, password, image_url, isSocailLogin, role, categories } = req.body;
  if (!fullname || !email || !password || !role) return sendError(res, "Please Provide all inputs!")
  const isNewUser = await User.isThisEmailInUse(email);
  if (!isNewUser) {
    // RemoveFiles(filename)
    return res.json({
      success: false,
      message: 'This email is already in use, try sign-in',
      isExist: true
    });
  }
  let subscriptionData = null
  if (role == 2) {
    subscriptionData = [{
      subscription: true,
      type: "Free Trail"
    }]
  }

  const user = await User({
    fullname,
    email,
    password,
    avatar: image_url,
    verified: isSocailLogin,
    role,
    categories,
    // stripeCustomerId: role == 2 ? customer?.id : null,
    freeTrial: role == 2,
    subscriptionData
  });
  const OTP = generateOTP()
  const verificationToken = new VerificationToken({
    owner: user._id,
    token: OTP
  })
  await verificationToken.save();
  await user.save();
  if (!isSocailLogin) {
    sendMail(OTP, email, emailTemplate, 'Verify your email account')
  }
  res.json({ success: true, user });
};

exports.userSignIn = async (req, res) => {
  console.log('jkk')

  const { email, password, isSocailLogin } = req.body;
  const user = await User.findOne({ email });
  if (!user) return sendError(res, 'user not found, with the given email!')
  if (!isSocailLogin) {
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 'email / Password does not match!')
    if (!user.verified) return sendError(res, 'Please verify the email first!')

  }

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
  res.json({ success: true, message: 'Email verified successfully', user })
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

exports.getSingleUser = async (req, res) => {
  const { category } = req.body
  const user = await User.find(category)
  return res.json({ user, success: true })
}

exports.getPodcastBycategory = async (req, res) => {
  const { category } = req.body
  const podcasts = await User.find()
  const FilterPodcast = podcasts.filter(user => user.podcast.category === category);
  return res.json({ podcasts: FilterPodcast, success: true })
}


exports.FollowUser = async (req, res) => {
  try {
    const { id, userid, uemail, oemail, uname, oname } = req.body
    const yourselfData = {
      id,
      // name: uname,
      email: uemail,
      createdAt: Date.now()
    }
    const followers = await User.findByIdAndUpdate(
      { _id: userid },
      { $push: { 'followers': yourselfData }, },
      { new: true },
    );

    const otherUserData = {
      id: userid,
      // name: oname,
      email: oemail,
      createdAt: Date.now()
    }
    const following = await User.findByIdAndUpdate(
      { _id: id },
      { $push: { 'following': otherUserData }, },
      { new: true },
    );
    return res.json({ success: true, message: 'Followed successfully', followers: JSON.stringify(followers.followers.length), following: JSON.stringify(following.following.length) })
  } catch (error) {
    return sendError(res, "Something went wrong!")
  }

}

exports.UnFollowUser = async (req, res) => {
  const { id, userid } = req.body

  try {
    const followers = await User.findByIdAndUpdate(
      userid,
      { $pull: { followers: { id: id } } },
      { new: true },
    )

    const following = await User.findByIdAndUpdate(
      id,
      { $pull: { following: { id: userid } } },
      { new: true },
    )
    return res.json({ success: true, message: 'UnFollowed successfully', followers: JSON.stringify(followers.followers.length), following: JSON.stringify(following.following.length) })
  } catch (error) {
    return sendError(res, "Something went wrong!")
  }

}

exports.TrendingPodcasts = async (req, res) => {
  try {
    const trendings = await User.find({}, { _id: 1, fullname: 2, avatar: 3 }).sort({ followers: -1 });
    return res.json({ success: true, trendings })
  } catch (error) {
    return sendError(res, "Something went wrong!")
  }

}

// export const uploadAttachment = async (req, res) => {
//   try {
//               const inputBuffer = req.file.buffer;

//               //save buffer to file
//               const inputFileExtension = path.extname(req.file.originalname);
//               const today = new Date();
//               const dateTime = today.toLocaleString();
//               const inputFile = `${dateTime}-input${inputFileExtension}`;



//               console.log("Saving file to disk...", inputFile);

//               fs.writeFileSync(inputFile, inputBuffer);
//               console.log("File saved to disk.");

//               console.log(`Checking input filesize in bytes`);
//               await checkFileSize(inputFile);

//               ffmpeg = require('fluent-ffmpeg')(inputFile)
//                   .output(req.file.originalname)
//                   .videoCodec("libx264")
//                   .audioCodec('aac')
//                   .videoBitrate(`1k`)
//                   .autopad()
//                   .on("end", async function () {
//                       console.log("Video compression complete!");

//                       const bucket = firebase.storage().bucket();
//                       const newFile = bucket.file(req.file.originalname);
//                       await newFile.save(`./${req.file.originalname}`);

//                       console.log(`Checking output filesize in bytes`);
//                       await checkFileSize(`./${req.file.originalname}`);

//                       fs.unlinkSync(inputFile);
//                       fs.unlinkSync(req.file.originalname)
//                       res.json("Files uploaded successfully.");
//                   })
//                   .run();
//           }
//    catch (error) {
//       console.log(error)
//       res.status(500).send({
//           message: "Something went wrong while uploading..."
//       })
//   }
// }
exports.uploadPodcast = async (req, res) => {
  const image = req.files['avatar'][0];
  const videos = req.files['videos[]'];
  const { description, category, userid } = req.body
  if (!image) {
    return sendErrorRemoveFile(res, "Please choose image")
  }
  if (!videos) {
    return sendErrorRemoveFile(res, "Please choose video")
  }
  let videoArray = []
  videos.map(video => videoArray.push(`${video.filename}`))
  const podcast = {
    description: description,
    image: `${image.filename}`,
    videos: videoArray,
    category: category
  }
  const user = await User.findByIdAndUpdate(
    { _id: userid },
    { podcast: podcast },
    { new: true }
  );
  return res.json({ success: true, message: 'Podcast created successfully', user })
}

exports.AddCatgories = async (req, res) => {
  const { id, categories } = req.body

  try {
    await User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          'categories': categories, // Update the nested property
        },
      },
    );
    return res.json({ success: true, message: 'Categories added successfully' })
  } catch (error) {
    return sendError(res, "Something went wrong!")
  }

}

exports.updatePodcastVideos = async (req, res) => {
  const videos = req.files['videos[]'];
  const { userid } = req.body
  if (!videos) {
    return sendErrorRemoveFile(res, "Please choose video")
  }
  const user = await User.findById(userid)
  const filenameArray = []
  videos.map((video) => filenameArray.push(`${video.filename}`))
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
  return res.json({ success: true, message: 'Podcast Videos updated successfully', user: userData })
}


exports.deletePodcastVideo = async (req, res) => {
  const { userid, filename } = req.body
  const user = await User.findById(userid)
  const podcastVideos = user.podcast.videos
  removeItemByName(podcastVideos, filename)
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
  return res.json({ success: true, message: 'Video deleted successfully!', user: userData })
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

exports.updateProfileImage = async (req, res) => {
  const avatar = req.file;
  const { oldimage, userid } = req.body
  const ext = avatar.originalname.substr(avatar.originalname.lastIndexOf('.'));
  const filename = `${avatar.originalname.replace(/\s/g, '')}-${req.query.randomId}${ext}`
  if (oldimage !== null || oldimage !== "null") {
    const match = oldimage.match(/8003\/(.*)/);
    const extractedString = match ? match[1] : null;
    removeDataFromUploads(extractedString)
  }
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

exports.updateProfileRole = async (req, res) => {
  const { role, userid } = req.body
  const user = await User.findByIdAndUpdate(
    { _id: userid },
    {
      $set: {
        'role': role
      },
    },
    { new: true }
  );
  return res.json({ success: true, message: 'Profile Role updated successfully!', user })
  // return res.json({ success: false, message: 'Something went wrong!' })
}

exports.updateSubscription = async (req, res) => {
  const { type, userid, email } = req.body
  console.log(req.body)
  const subscriptionData = [{
    subscription: true,
    type: type
  }]
  const user = await User.findByIdAndUpdate(
    { _id: userid },
    {
      $set: {
        'subscriptionData': subscriptionData
      },
    },
    { new: true }
  );
  sendMail(type, email, SubSuccessEmailTemplate, "Welcome Podcast Tonight Subscription Plan")
  return res.json({ success: true, message: 'Payment Done successfully!', user })
  // return res.json({ success: false, message: 'Something went wrong!' })
}

exports.IsUserExist = async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email });
  if (user) {
    return res.json({ success: true, user })
  } else {
    return res.json({ success: false, user })
  }
  // return res.json({ success: false, message: 'Something went wrong!' })
}
// shorts controllers start

exports.GetAllShortVideos = async (req, res) => {
  Shorts.findOne({}, function (err, result) {
    if (err) throw err;
    return res.json({ success: true, shorts: result?.shorts ? result?.shorts : [] })
  })
}

exports.GetAllPodcasts = async (req, res) => {
  Shorts.findOne({}, function (err, result) {
    if (err) throw err;
    return res.json({ success: true, shorts: result?.shorts ? result?.shorts : [] })
  })
}


exports.uploadShortVideos = async (req, res) => {
  const thumbnail = req.files['thumbnail'][0];
  const video = req.files['short'][0];
  const { caption, category, userid } = req.body

  const short = await Short({
    userid,
    caption,
    category,
    video: `${video.filename}`,
    thumbnail: `${thumbnail.filename}`,
    createdAt: Date.now()
  });

  short.save().then(res => console.log(res, 'waj yar'))
  return res.json({ success: true, message: 'Short Uploaded successfully!' })

  // const count = await Shorts.countDocuments()
  // if (count === 0) {
  //   const result = await Shorts.updateOne(
  //     { /* Your query to identify the document to update */ },
  //     { $push: { 'shorts': short }, },
  //     { upsert: true }
  //   );
  //   if (result.n === 1) {
  //     return res.json({ success: true, message: 'Short Uploaded successfully!' })
  //   } else {
  //     return res.json({ success: false, message: 'Something went wrong!' })
  //   }
  // } else {
  //   const result = await Shorts.updateOne(
  //     { /* Your query to identify the document to update */ },
  //     { $push: { 'shorts': short }, }
  //   );
  //   if (result.nModified === 1) {
  //     return res.json({ success: true, message: 'Short Uploaded successfully!' })
  //   } else {
  //     return res.json({ success: false, message: 'Something went wrong!' })
  //   }

  // }

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
