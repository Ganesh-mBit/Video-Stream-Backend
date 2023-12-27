import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
