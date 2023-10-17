import express from "express";
import { createStory } from "../controllers/storyCtrls.js";
import { isAuthenticatedUser } from "../middlewares/auth.js";

// router
const router = express.Router();

router.route("/uploadstory").post(isAuthenticatedUser, createStory); // not tested may be error this is dummy

// make to delete story update story atuo delete story after 24hours

export default router;
// working
