import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;
    // Upload the file to the cloudinary
    const respone = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    console.log("File uploaded on cloudinary :", respone.url);
    return respone;
  } catch (error) {
    // Remove the temporary file from local storage
    fs.unlinkSync(filePath);
    return null;
  }
};

export { uploadOnCloudinary };
