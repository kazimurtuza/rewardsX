import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    firstName: {
      type: String,
      require: true,
    },
    lastName: {
      type: String,
      require: true,
    },
    fullName: {
      type: String,
      require: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    photo: {
      type: String,
      require: false,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    resetCode: {
      type: String,
    },
    resetCodeTime: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    radious: {
      type: String,
    },
    duration: {
      type: String,
    },
    isMailAuthentic: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number,
      default: 1,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("firstName") || this.isModified("lastName")) {
    this.fullName = this.firstName + " " + this.lastName;
  }
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate(); // Access the update data

  // Check if firstName or lastName is being updated
  if (update.firstName || update.lastName) {
    const fullName = `${update.firstName || ""} ${
      update.lastName || ""
    }`.trim();
    this.setUpdate({ ...update, fullName }); // Update fullName based on firstName and lastName
  }

  // Check if the password is being updated
  if (update.password) {
    const hashedPassword = await bcrypt.hash(update.password, 10);
    this.setUpdate({ ...update, password: hashedPassword }); // Update password with hashed password
  }

  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
