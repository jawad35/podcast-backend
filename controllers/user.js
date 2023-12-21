const jwt = require('jsonwebtoken');
const User = require('../models/user');
const sharp = require('sharp');
const VerificationToken = require('../models/verificationToken');
const generateOTP = require('../utils/generateOTP');
const sendMail = require('../utils/sendMails');
const { sendError } = require('../helper/ErrorMessage');
const { isValidObjectId } = require('mongoose');
const emailTemplate = require('../utils/emailTemplate');
const VerifiefSuccessEmailTemplate = require('../utils/verifiefSuccessEmailTemplate');
const { CreateRandomBytes } = require('../helper/createRandombytes');
const ResetpassEmailTemplate = require('../utils/resetpassEmailTemplate');
const resetpassToken = require('../models/resetpassToken');
const ResetPassSuccessTemplate = require('../utils/resetPassSuccess');
// const cloudinary = require('../helper/imageUpload');
exports.createUser = async (req, res) => {
  const { fullname, email, password } = req.body;
  const isNewUser = await User.isThisEmailInUse(email);
  if (!isNewUser)
    return res.json({
      success: false,
      message: 'This email is already in use, try sign-in',
    });
  const user = await User({
    fullname,
    email,
    password,
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
