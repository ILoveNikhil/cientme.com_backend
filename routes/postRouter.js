import express from "express";
import {
  commentOnPost,
  createPost,
  deleteComment,
  deletePost,
  getPostOfFollowing,
  likeAndUnlikePost,
  // savedPost,
  updateCaption,
} from "../controllers/postCtrls.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

// router
const router = express.Router();

router.route("/upload").post(isAuthenticatedUser, createPost); // working change post method to -> get method
// router.route("/savedpost").post(isAuthenticatedUser, savedPost); // working change post method to -> get method
router
  .route("/:id")
  .get(isAuthenticatedUser, likeAndUnlikePost) // working
  .put(isAuthenticatedUser, updateCaption) // working
  .delete(isAuthenticatedUser, deletePost); // working
router.route("/posts").get(isAuthenticatedUser, getPostOfFollowing); //not tested still not used in frontend
router
  .route("/comment/:id")
  .put(isAuthenticatedUser, commentOnPost) // working
  .delete(isAuthenticatedUser, deleteComment); //working

export default router;
// working
