import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { APP_VERSION } from "./constants.js";

const app = express();

app.use(cors()); // Cross origin Resource Sharing
app.use(express.json({ limit: "16kb" })); // For taking data from req.body
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // For taking data from url
app.use(express.static("public")); // Loading static files from specified folder
app.use(cookieParser()); // To securely set & remove cookies from browser

// Import routes
import userRoutes from "./routes/user.routes.js";

// Route declarations

app.use(`/api/${APP_VERSION}/user`, userRoutes);

export { app };
