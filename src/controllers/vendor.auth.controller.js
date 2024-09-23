import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import path from "path";
import ejs from "ejs";
import fs from "fs";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import { Vendor } from "../models/vendor.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await Vendor.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, password, email, phone } = req.body;
  if (
    [firstName, lastName, password, email].some((filed) => {
      filed?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are Required");
  }

  const existedUser = await Vendor.findOne({
    $or: [{ email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with  email or username already exists");
  }

  //   const photo=req.files?.photo[0]?.path

  const user = await Vendor.create({
    firstName,
    lastName,
    phone,
    password,
    email,
  });

  const createdUser = await Vendor.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "something went wrong  while registering the user "
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!password && !email) {
    throw new ApiError(400, "Email or password is required");
  }

  const user = await Vendor.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await Vendor.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await Vendor.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});
const resetCodeVerify = asyncHandler(async (req, res) => {
  const { email, resetCode } = req.body;

  const user = await Vendor.findOne({ email, resetCode });
  if (!user) {
    return res.status(404).json(new ApiError(404, {}, "Code is not Valid"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { _id: user._id }, "Code is Valid"));
});

const resetCodeSend = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await Vendor.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  var code = Math.floor(100000 + Math.random() * 900000);

  const userInfo = await Vendor.findOneAndUpdate(
    { email: user.email }, // Query criteria to find the document
    { resetCode: code, resetCodeTime: new Date() }, // Update object
    { new: true } // Option to return the updated document
  );

  const emailTemplatePath = path.resolve(
    __dirname,
    "views",
    "mails",
    "forget_password.ejs"
  );
  const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
  const resetLink = "link";
  const mailContent = ejs.render(emailTemplate, {
    resetLink,
    name: userInfo.fullName,
    date: new Date(),
    code: userInfo.resetCode,
  });
  const transporter = nodemailer.createTransport({
    host: "technovicinity.com",
    port: 465,
    secure: true, // Set to false for explicit TLS
    auth: {
      user: "dev@technovicinity.com",
      pass: "Ah3vmKQnq?&x",
    },
    tls: {
      // Do not fail on invalid certificates
      //rejectUnauthorized: false,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userInfo.email,
    subject: "Reward-X's  Account Password Reset",
    html: mailContent,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Successfully reset code send to your mail")
    );
});

const passwordUpdate = asyncHandler(async (req, res) => {
  const { _id, password, confirmPassword } = req.body;
  if (password === confirmPassword) {
    await Vendor.findByIdAndUpdate(_id, { password });
  } else {
    return res
      .status(404)
      .json(
        new ApiError(404, {}, "password and confirm Password is not equal ")
      );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully updated your password"));
});

const userProfileInfo = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user));
});

const update = asyncHandler(async (req, res) => {
  const {
    _id,
    firstName,
    lastName,
    email,
    phone,
    radious,
    duration,
    password,
  } = req.body;

  const update = await Vendor.findByIdAndUpdate(
    _id,
    {
      firstName,
      lastName,
      email,
      phone,
      radious,
      duration,
      password,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully updated "));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  resetCodeSend,
  resetCodeVerify,
  passwordUpdate,
  update,
  userProfileInfo,
};
