import { User } from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import { ErrorHandler } from "../utils/ErrorHander.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
// signup
export const signup = catchAsyncErrors(async (req, res, next) => {
  const { fullName, userName, phoneNumber, email, password, avatar } = req.body;
  // if (!fullName || !userName || !phoneNumber || !email || !password) {
  //   return next(new ErrorHandler("Please enter all required field", 400));
  // }
  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorHandler("User already exists", 400));
  }

  // this is comment--- store avatar on cloudinary -- not working now
  // const myCloud = await cloudinary.v2.uploader.upload(avatar, {
  //   folder: "avatars",
  //   width: 150,
  //   crop: "scale",
  // });
  user = await User.create({
    fullName,
    userName,
    phoneNumber,
    email,
    password,
    // avatar: {
    //   public_id: myCloud.public_id,
    //   url: myCloud.secure_url,
    // },
    avatar: { public_id: "myCloud.public_id", url: "myCloud.secure_url" },
  });

  // send token and user details in frontend cookie
  sendToken(user, 201, res, "Signup succesfuly Done, User Created");
});
// login
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  // checking if user has given password and email both
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  // send token
  sendToken(user, 200, res, "User Login Successfully");
};
// Logout User
export const logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("cientme_token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});
// Forgot Password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("This Email have not account", 404));
  }
  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;
  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Cientme Password Recovery`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});
// Reset Password
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password", 400));
  }
  user.password = req.body.newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(
    user,
    200,
    res,
    "Password Reset Done, Please Login with new Password"
  );
});
// Get User Detail
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});
// update User password
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword) {
    return next(new ErrorHandler("Please enter oldPassword", 400));
  }
  if (!newPassword) {
    return next(new ErrorHandler("Please enter newPassword", 400));
  }
  if (!confirmPassword) {
    return next(new ErrorHandler("Please enter confirmPassword", 400));
  }
  const isPasswordMatched = await user.matchPassword(oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect Old password", 400));
  }
  if (newPassword !== confirmPassword) {
    return next(
      new ErrorHandler("newPassword and confirmPassword does not match", 400)
    );
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res, "Your Password Updated");
});
// followUser
export const followUser = catchAsyncErrors(async (req, res, next) => {
  const userToFollow = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);
  if (!userToFollow) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (loggedInUser.following.includes(userToFollow._id)) {
    const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
    const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id);

    loggedInUser.following.splice(indexfollowing, 1);
    userToFollow.followers.splice(indexfollowers, 1);

    await loggedInUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: "User Unfollowed",
    });
  } else {
    loggedInUser.following.push(userToFollow._id);
    userToFollow.followers.push(loggedInUser._id);

    await loggedInUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: "User followed",
    });
  }
});
// updateProfile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const { name, email, avatar } = req.body;
  if (name) {
    user.name = name;
  }
  if (email) {
    user.email = email;
  }
  if (avatar) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    });
    user.avatar.public_id = myCloud.public_id;
    user.avatar.url = myCloud.secure_url;
  }
  await user.save();
  res.status(200).json({
    success: true,
    message: "Profile Updated",
  });
});
// deleteMyProfile
export const deleteMyProfile = catchAsyncErrors(async (req, res) => {
  const user = await User.findById(req.user._id);
  const posts = user.posts;
  const followers = user.followers;
  const following = user.following;
  const userId = user._id;
  // Removing Avatar from cloudinary
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  await user.deleteOne();
  // Logout user after deleting profile
  res.cookie("cientme_token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  // Delete all posts of the user
  for (let i = 0; i < posts.length; i++) {
    const post = await Post.findById(posts[i]);
    await cloudinary.v2.uploader.destroy(post.image.public_id);
    await post.deleteOne();
  }
  // Removing User from Followers Following
  for (let i = 0; i < followers.length; i++) {
    const follower = await User.findById(followers[i]);

    const index = follower.following.indexOf(userId);
    follower.following.splice(index, 1);
    await follower.save();
  }
  // Removing User from Following's Followers
  for (let i = 0; i < following.length; i++) {
    const follows = await User.findById(following[i]);

    const index = follows.followers.indexOf(userId);
    follows.followers.splice(index, 1);
    await follows.save();
  }
  // removing all comments of the user from all posts
  const allPosts = await Post.find();
  for (let i = 0; i < allPosts.length; i++) {
    const post = await Post.findById(allPosts[i]._id);
    for (let j = 0; j < post.comments.length; j++) {
      if (post.comments[j].user === userId) {
        post.comments.splice(j, 1);
      }
    }
    await post.save();
  }
  // removing all likes of the user from all posts
  for (let i = 0; i < allPosts.length; i++) {
    const post = await Post.findById(allPosts[i]._id);

    for (let j = 0; j < post.likes.length; j++) {
      if (post.likes[j] === userId) {
        post.likes.splice(j, 1);
      }
    }
    await post.save();
  }
  res.status(200).json({
    success: true,
    message: "Profile Deleted",
  });
});
// myProfile
export const myProfile = catchAsyncErrors(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "posts followers following"
  );
  res.status(200).json({
    success: true,
    user,
  });
});
// getUserProfile
export const getUserProfile = async (req, res, next) => {
  const user = await User.findById(req.params.id).populate(
    "posts followers following"
  );
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
};
// getAllUsers
export const getAllUsers = catchAsyncErrors(async (req, res) => {
  const users = await User.find({
    name: { $regex: req.query.name, $options: "i" },
  });
  res.status(200).json({
    success: true,
    users,
  });
});
// getMyPosts
export const getMyPosts = catchAsyncErrors(async (req, res) => {
  const user = await User.findById(req.user._id);
  const posts = [];
  for (let i = 0; i < user.posts.length; i++) {
    const post = await Post.findById(user.posts[i]).populate(
      "likes comments.user owner"
    );
    posts.push(post);
  }
  res.status(200).json({
    success: true,
    posts,
  });
});
// getUserPosts
export const getUserPosts = catchAsyncErrors(async (req, res) => {
  const user = await User.findById(req.params.id);
  const posts = [];
  for (let i = 0; i < user.posts.length; i++) {
    const post = await Post.findById(user.posts[i]).populate(
      "likes comments.user owner"
    );
    posts.push(post);
  }
  res.status(200).json({
    success: true,
    posts,
  });
});
