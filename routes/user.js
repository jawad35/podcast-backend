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
  updateProfileImage,
  updateProfileFullname,
  updatePodcastVideos,
  uploadShortVideos,
  updateShortVCategory,
  updateShortVCaption,
  GetAllShortVideos,
  getSingleUser,
  FollowUser,
  UnFollowUser,
  TrendingPodcasts,
  AddCatgories,
  updateProfileRole
} = require('../controllers/user');
const {
  userVlidation, validateUserSignIn,
} = require('../middlewares/validation/user');
const { IsResetPassTokenValid } = require('../middlewares/validation/isresetpasstokenvalid');
const multer = require('../middlewares/multer');
const store = require('../middlewares/multer')

// testing
router.get('/test', (req, res) => {
  res.json({message:"backend is running"})
});

// router.post('/sign-in', validateUserSignIn, userVlidation,userSignIn);
router.post('/login', userSignIn);



// router.post('/create', multer.single('avatar'), createUser);
router.post('/create', createUser);
router.post('/verify-email', verifyEmail);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', resetPassword);
router.post('/getuser', getSingleUser);
router.post('/update-role', updateProfileRole);

router.get('/trendings', TrendingPodcasts);
router.post('/follow', FollowUser);
router.post('/unfollow', UnFollowUser);
router.post('/add-categories', AddCatgories);




//  start podcast 
router.post('/profile-image-update', multer.single('avatar'), updateProfileImage);
router.post('/profile-fullname-update', updateProfileFullname);

// router.post('/reset-password', IsResetPassTokenValid, resetPassword);
router.post('/upload-podcast', store.fields([{ name: 'avatar', maxCount: 1 }, { name: 'videos[]'}]), uploadPodcast);
router.post('/upload-podcast-videos', store.fields([{ name: 'videos[]'}]), updatePodcastVideos);
//  end podcast 

// start shorts

router.post('/upload-short-videos', store.single('short'), uploadShortVideos);
router.post('/update-shortv-category', updateShortVCategory);
router.post('/update-shortv-caption', updateShortVCaption);
router.get('/get-short-videos', GetAllShortVideos);



// end shorts
router.post('/pvideo-delete', deletePodcastVideo);
router.post('/pimage-update', multer.single('avatar'), updatePodcastImage);
router.post('/pdesc-update', updatePodcastDescription);
router.post('/pcategory-update', updatePodcastCategory);



// router.post('/sign-out', isAuth, signOut);
// router.post(
//   '/upload-profile',
//   isAuth,
//   uploads.single('profile'),
//   uploadProfile
// );

module.exports = router;



