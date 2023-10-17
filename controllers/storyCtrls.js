import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import cloudinary from "cloudinary";
import { ErrorHandler } from "../utils/ErrorHander.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
// createPost
export const createStory = catchAsyncErrors(async (req, res, next) => {
  const { image, caption } = req.body;
  // check if any individual field is not field send error massage
  const errors = [];
  if (!image) {
    errors.push("Please choose image");
  }
  if (!caption) {
    errors.push("Please write caption");
  }
  if (errors.length > 0) {
    return next(new ErrorHandler(errors, 400));
  }
  // upload post image on cloudinary server
  const myCloud = await cloudinary.v2.uploader.upload(image, {
    folder: "6pp Social WebApp",
  });
  // create post if all above code is ok
  const newPostData = {
    caption: caption,
    image: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
    owner: req.user._id,
  };
  const post = await Post.create(newPostData);
  const user = await User.findById(req.user._id);
  user.posts.unshift(post._id);
  await user.save();
  res.status(201).json({
    success: true,
    message: "Story uploaded",
  });
});
