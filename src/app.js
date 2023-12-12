import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors()); // Cross origin Resource Sharing
app.use(express.json({ limit: "16kb" })); // For taking data from req.body
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // For taking data from url
app.use(express.static("public")); // Loading static files from specified folder
app.use(cookieParser()); // To securely set & remove cookies from browser

export { app };
