import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import cloudinary from "cloudinary";
import { ErrorHandler } from "../utils/ErrorHander.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
// createPost
export const createPost = catchAsyncErrors(async (req, res, next) => {
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
    message: "Post created",
  });
});
// savedPost -- not tested
// export const savedPost = catchAsyncErrors(async (req, res, next) => {
//   const post = await Post.findById(req.params.id);
//   const user = await User.findById(req.user._id);
//   user.savedPost.(post._id);
//   await user.save();
//   res.status(201).json({
//     success: true,
//     message: "Post saved in your account",
//   });
// });
// deletePost
export const deletePost = async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  //   check if post not found send error massage
  if (!post) {
    return next(new ErrorHandler("Post not found", 404));
  }
  if (post.owner.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized", 401));
  }
  await cloudinary.v2.uploader.destroy(post.image.public_id);
  await post.deleteOne();
  const user = await User.findById(req.user._id);
  const index = user.posts.indexOf(req.params.id);
  user.posts.splice(index, 1);
  await user.save();
  res.status(200).json({
    success: true,
    message: "Post deleted",
  });
};
// likeAndUnlikePost
export const likeAndUnlikePost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  //   check if post not found send error massage
  if (!post) {
    return next(new ErrorHandler("Post not found", 404));
  }
  if (post.likes.includes(req.user._id)) {
    const index = post.likes.indexOf(req.user._id);
    post.likes.splice(index, 1);
    await post.save();
    return res.status(200).json({
      success: true,
      message: "Post Unliked",
    });
  } else {
    post.likes.push(req.user._id);
    await post.save();
    return res.status(200).json({
      success: true,
      message: "Post Liked",
    });
  }
});
// getPostOfFollowing
export const getPostOfFollowing = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }
  const posts = await Post.find({
    owner: {
      $in: user.following,
    },
  }).populate("owner likes comments.user");
  res.status(200).json({
    success: true,
    posts: posts.reverse(),
  });
});
// updateCaption
export const updateCaption = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new ErrorHandler("Post not found", 404));
  }
  if (post.owner.toString() !== req.user._id.toString()) {
    return next("Unauthorized", 401);
  }
  post.caption = req.body.caption;
  await post.save();
  res.status(200).json({
    success: true,
    message: "Post updated",
  });
});
// commentOnPost
export const commentOnPost = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new ErrorHandler("Post not found", 404));
  }
  let commentIndex = -1;
  // Checking if comment already exists
  post.comments.forEach((item, index) => {
    if (item.user.toString() === req.user._id.toString()) {
      commentIndex = index;
    }
  });
  if (commentIndex !== -1) {
    post.comments[commentIndex].comment = req.body.comment;
    await post.save();
    return res.status(200).json({
      success: true,
      message: "Comment Updated",
    });
  } else {
    post.comments.push({
      user: req.user._id,
      comment: req.body.comment,
    });
    await post.save();
    return res.status(200).json({
      success: true,
      message: "Comment added",
    });
  }
});
// deleteComment
export const deleteComment = catchAsyncErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new ErrorHandler("Post not found", 404));
  }
  // Checking If owner wants to delete
  if (post.owner.toString() === req.user._id.toString()) {
    if (req.body.commentId === undefined) {
      return next(new ErrorHandler("Comment Id is required", 400));
    }
    post.comments.forEach((item, index) => {
      if (item._id.toString() === req.body.commentId.toString()) {
        return post.comments.splice(index, 1);
      }
    });
    await post.save();
    return res.status(200).json({
      success: true,
      message: "Selected Comment has deleted",
    });
  } else {
    post.comments.forEach((item, index) => {
      if (item.user.toString() === req.user._id.toString()) {
        return post.comments.splice(index, 1);
      }
    });
    await post.save();
    return res.status(200).json({
      success: true,
      message: "Your Comment has deleted",
    });
  }
});
