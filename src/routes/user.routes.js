import { Router } from "express";
import {
  changeUserPassword,
  getUserDetails,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "profileImg",
      maxCount: 1,
    },
    {
      name: "coverImg",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh").post(refreshAccessToken);

//? Secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/update/password").post(verifyJwt, changeUserPassword);
router.route("/profile").get(verifyJwt, getUserDetails);
router
  .route("/update/image")
  .post(verifyJwt, upload.single, changeUserPassword);

export default router;
