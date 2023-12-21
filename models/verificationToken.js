const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const verificationTokenSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required: true,
  },
  token:{
    type:String,
    required:true
  },
  createdAt:{
    type:Date,
    expires:3600,
    default:Date.now()
  }
});

verificationTokenSchema.pre('save', function (next) {
  if (this.isModified('token')) {
    bcrypt.hash(this.token, 8, (err, hash) => {
      if (err) return next(err);

      this.token = hash;
      next();
    });
  }
});

verificationTokenSchema.methods.compareToken = async function (token) {
  if (!token) throw new Error('token is mission, can not compare!');
  try {
    const result = await bcrypt.compare(token, this.token);
    return result;
  } catch (error) {
    console.log('Error while comparing token!', error.message);
  }
};


module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
