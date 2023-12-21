const generateOTP = () => {
    let otp = '';
    for (let index = 0; index <=3; index++) {
      const randval = Math.round(Math.random() * 9)
      otp = otp + randval
    }
    return otp
  }
module.exports = generateOTP