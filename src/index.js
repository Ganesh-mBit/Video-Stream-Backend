import dotenv from "dotenv";
import connectDB from "./db/index.js";

// Configuration set-up
dotenv.config();

connectDB();
