const mongoose = require('mongoose');

const shortsSchema = new mongoose.Schema({
    shorts:[],
    createdAt: {
        type: Date,
        default: Date.now
      },
    query:String,

})

shortsSchema.pre('save', function (next) {
  if (this.isModified('token')) {
    bcrypt.hash(this.token, 8, (err, hash) => {
      if (err) return next(err);

      this.token = hash;
      next();
    });
  }
});

module.exports = mongoose.model('Short', shortsSchema);