const express = require('express');

const router = express.Router();

const {
  createUser,
  userSignIn,
  verifyEmail,
  forgetPassword,
  resetPassword,
  uploadPodcast,
  deletePodcastVideo,
  updatePodcastImage,
  updatePodcastDescription,
  updatePodcastCategory,
  uploadShort
} = require('../controllers/user');
const {
  userVlidation, validateUserSignIn,
} = require('../middlewares/validation/user');
const { IsResetPassTokenValid } = require('../middlewares/validation/isresetpasstokenvalid');
const multer = require('../middlewares/multer');
const store = require('../middlewares/multer')

// router.post('/sign-in', validateUserSignIn, userVlidation,userSignIn);
router.post('/login', userSignIn);

router.post('/create', multer.single('avatar'), createUser);
router.post('/verify-email', verifyEmail);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', IsResetPassTokenValid, resetPassword);
router.post('/upload-podcast', store.fields([{ name: 'avatar', maxCount: 1 }, { name: 'videos[]'}]), uploadPodcast);
router.post('/pvideo-delete', deletePodcastVideo);
router.post('/pimage-update', multer.single('avatar'), updatePodcastImage);
router.post('/pdesc-update', updatePodcastDescription);
router.post('/pcategory-update', updatePodcastCategory);
router.post('/upload-short', store.single('short'), uploadShort);







// router.post('/sign-out', isAuth, signOut);
// router.post(
//   '/upload-profile',
//   isAuth,
//   uploads.single('profile'),
//   uploadProfile
// );

module.exports = router;



