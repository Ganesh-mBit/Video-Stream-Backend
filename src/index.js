import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Configuration set-up
dotenv.config();

// Connect MongoDB
const Port = process.env.PORT || 4000;
connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("Error : ", err);
      throw err;
    });

    app.listen(Port, () => {
      console.log("⚙ server is running on port " + Port);
    });
  })
  .catch((err) => {
    console.log("Mongo DB connection failed: ", err);
  });
