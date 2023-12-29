import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Opps somting went wrong, please try again later!");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend - req.body
  // Validation for empty fields if miss from frontend
  // Check if user already exists - email
  // check if Image and Avatar
  // if any files provided upload on cloudinary server
  // craete a new user object & add entry in DB
  // remove password from refresh token from response

  // req.body will give only json data not files
  const { fullName, email, gender, password } = req.body;

  // Check for empty fields if miss from frontend
  if (
    [fullName, email, gender, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please provide a valid data");
  }

  // Check if user already exists
  const userExist = await User.findOne({ email });
  if (userExist) {
    throw new ApiError(409, "User already exists");
  }

  // When we pass upload middleware bts it will add some file data in req.files or req.file
  const imgUrlLocalPath = req?.files?.profileImg?.[0]?.path;
  const coverImgLocalPath = req?.files?.coverImg?.[0]?.path;

  // Check if imgUrlLocalPath is correct & exists on local filesystem
  if (!imgUrlLocalPath) {
    throw new ApiError(400, "Profile picture in required");
  }

  const profileImg = await uploadOnCloudinary(imgUrlLocalPath);
  const coverImg = await uploadOnCloudinary(coverImgLocalPath);

  // If files are not uploaded on cloudinary server
  if (!profileImg) {
    throw new ApiError(400, "Cloudinary file upload failed");
  }

  const user = await User.create({
    fullName,
    email,
    gender,
    password,
    imgUrl: profileImg.url,
    coverImg: coverImg?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Opps somthing went wrong, please try again");
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User is created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take inputs from request body
  // Check if the user with given email exists in database
  // Find the user with the given email in database
  // Check & authenticate the enyered password in correct
  // generate a access token if above conditions meet
  // return the user in response with access & refresh token
  // send a secure cookies
  const { email, password } = req.body;

  if (!(email || password)) {
    throw new ApiError(400, "Please enter valid email or password");
  }

  const user = await User.findOne({ email });
  /*
  This code is for if we want to find either one or more keys
  const userExist = await User.findOne({
    $or: [[email, username]]
  });
  */
  // if user not exists
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // custom added methods always found in instance
  const isValidPassword = await user.isCorrectPassword(password);
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Set cookies options
  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Successfully logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unathorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken?._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is used or expired");
  }

  const { accessToken, refreshToken } = await generateTokens(user?._id);
  // Set cookies options
  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: user, accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!(oldPassword || newPassword)) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findById(req?.user?._id);
  const passwordMatch = user.isCorrectPassword(oldPassword);

  if (!passwordMatch) {
    throw new ApiError(400, "Invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"));
});

const getUserDetails = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req?.user, "SUCCESS"));
});

const updateUserImage = asyncHandler(async (req, res) => {
  const localPath = req?.file?.path;
  if (localPath) {
    throw new ApiError(400, "Image is required");
  }

  const uploadedImage = await uploadOnCloudinary(localPath);
  if (!uploadedImage.url) {
    throw new ApiError(400, "failed to upload image");
  }

  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        imgUrl: uploadedImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Image uploaded successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getUserDetails,
  updateUserImage,
};
