// require("dotenv").config({ path: "/.env" });
import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config(); // Load .env variables

connectDB()
  .then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running at port : ${process.env.PORT}`)
    });
  })
  .catch((error) => {
    console.error("Mongo DB Connection Failed :", error);
  });

// import express from "express";
// const app = express();

// async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("ERROR", error);
//       throw error;
//     });
//     app.listen(process.env.PORT,()=>{
//         console.log()
//     })
//   } catch (error) {
//     console.error("ERROR:", error);
//     throw error;
//   }
// };
