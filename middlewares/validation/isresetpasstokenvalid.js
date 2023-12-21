const { isValidObjectId } = require("mongoose")
const { sendError } = require("../../helper/ErrorMessage")
const User = require("../../models/user")
const ResetpassToken = require("../../models/resetpassToken")

exports.IsResetPassTokenValid = async (req, res, next) => {
    const {token, id} = req.query
    if (!token || !id) return sendError(res, "Invalid Request!")
    if (!isValidObjectId(id)) return sendError(res, "Invalid user!")
    const user = await User.findById(id)
    if (!user) return sendError(res, "User not found!")
    const resetToken = await ResetpassToken.findOne({owner:user._id})
    if (!resetToken) return sendError(res, "Reset token not found!")
    const isValidToken = await resetToken.compareToken(token)
    if (!isValidToken) return sendError(res, "Reset token is not valid!")

    req.user = user

    next()

}