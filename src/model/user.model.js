import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      index: true,
      required: function () {
    return this.isProfileCompleted;
  }
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address"
      ],
      index: true
    },

    password: {
      type: String,
      minlength: 6,
      select: false, 
      required: function () {
    return this.isProfileCompleted;
  }
    },

    role: {
      type: String,
      enum: ["student", "teacher"],
      default: "student"
    },

    xp: {
      type: Number,
      default: 0,
      min: 0
    },

    avatar: {
      type: String,
      default: "https://example.com/default-avatar.png"
    },

    certificate: {
      type: String
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  { timestamps: true }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compare(password, this.password);
};


userSchema.methods.generateToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.TOKENKEYSECRET,
    { expiresIn: process.env.TOKENDATE }
  );
};

export default mongoose.model("User", userSchema);
