const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: String,
  verified: {
    type: Boolean,
    default: false,
    required: true
  },
  subscriptionData: [{
    subscription: {
      type: Boolean,
      default: false,
      required: true
    },
    type: {
      type: String,
      default: null,
      required: true
    },
    subscriptionDate: {
      type: Date,
      default: Date.now
    }

  }],
  freeTrial: {
    type: Boolean,
    default: false,
    required: true
  },
  podcast: {
    description: '',
    image: '',
    videos: [],
    category: ''
  },
  shorts: [],
  categories: [],
  followers: [],
  following: [],
  createdAt: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    default: null,
    required: true
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/dqmoofr4j/image/upload/v1704196080/podcast/default_image_r8phxz.jpg'
  },
  // stripeCustomerId: {
  //   type: String,
  //   required: true,
  // }
});

userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, 8, (err, hash) => {
      if (err) return next(err);

      this.password = hash;
      next();
    });
  }
});

userSchema.methods.comparePassword = async function (password) {
  if (!password) throw new Error('Password is mission, can not compare!');

  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    console.log('Error while comparing password!', error.message);
  }
};

userSchema.statics.isThisEmailInUse = async function (email) {
  if (!email) throw new Error('Invalid Email');
  try {
    const user = await this.findOne({ email });
    if (user) return false;

    return true;
  } catch (error) {
    console.log('error inside isThisEmailInUse method', error.message);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);
