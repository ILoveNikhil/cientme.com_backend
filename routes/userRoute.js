import express from "express";
import {
  deleteMyProfile,
  followUser,
  forgotPassword,
  getAllUsers,
  getMyPosts,
  getUserDetails,
  getUserPosts,
  getUserProfile,
  login,
  logout,
  resetPassword,
  signup,
  updatePassword,
  updateProfile,
} from "../controllers/userCtrls.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

// router
const router = express.Router();

router.post("/signup", signup); // working
router.post("/login", login); // working
router.route("/password/forgot").post(forgotPassword); // working
router.route("/password/reset/:token").put(resetPassword); // working
router.route("/me").get(isAuthenticatedUser, getUserDetails); // working
router.route("/password/update").put(isAuthenticatedUser, updatePassword); // working
router.route("/logout").get(isAuthenticatedUser, logout); // working

router.route("/update/profile").put(isAuthenticatedUser, updateProfile); // working
router.route("/delete/me").delete(isAuthenticatedUser, deleteMyProfile); // working
router.route("/my/posts").get(isAuthenticatedUser, getMyPosts); // working
router.route("/users").get(isAuthenticatedUser, getAllUsers); // not working - correct it code is correct but not got user in forntend
router.route("/user/:id").get(isAuthenticatedUser, getUserProfile); // not tested but code written is correcct
router.route("/follow/:id").get(isAuthenticatedUser, followUser); // not tested but code written is correcct
router.route("/userposts/:id").get(isAuthenticatedUser, getUserPosts); // not tested but code written is correcct

export default router;
