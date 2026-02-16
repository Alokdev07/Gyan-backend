import User from "../model/user.model.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { uploadFileOnCloudinary } from "../utilities/cloudinary.js";
import { sendOtpEmail } from "../utilities/generateOtp.js";
import { oauth2Client } from "../utilities/google.js";
import axios from "axios";

let otpMap = new Map();
let googleMap = new Map();

const generateOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    throw new ApiError("Email and purpose are required", [], 400);
  }

  const userExists = await User.findOne({ email });
  console.log(userExists);

  if (purpose === "register" && userExists) {
    throw new ApiError("Email already exists", [], 400);
  }

  if (purpose === "forgot-password" && !userExists) {
    throw new ApiError("Email not registered", [], 400);
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  const sent = await sendOtpEmail(email.trim(), otp);
  if (!sent) throw new ApiError("OTP sending failed", [], 500);

  otpMap.set(email.trim(), {
    otp: Number(otp),
    purpose,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, `OTP sent for ${purpose}`));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, purpose } = req.body;

  if (!email || !otp || !purpose) {
    throw new ApiError("All fields are required", [], 400);
  }

  const storedOtpData = otpMap.get(email.trim());
  if (!storedOtpData) {
    throw new ApiError("OTP not found or expired", [], 400);
  }

  const { otp: storedOtp, expiresAt, purpose: storedPurpose } = storedOtpData;

  if (storedPurpose !== purpose) {
    throw new ApiError("OTP purpose mismatch", [], 400);
  }

  if (Date.now() > expiresAt) {
    otpMap.delete(email.trim());
    throw new ApiError("OTP expired", [], 400);
  }

  if (Number(otp) !== storedOtp) {
    throw new ApiError("Wrong OTP", [], 400);
  }

  otpMap.delete(email.trim());

  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP verified successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, fullName, password, role, certificate } = req.body;

  if ([email, username, fullName, password].some((f) => !f?.trim())) {
    throw new ApiError("All fields are required", [], 400);
  }

  if (role && !["student", "teacher"].includes(role)) {
    throw new ApiError("Invalid role", [], 400);
  }

  if (role === "teacher" && !certificate?.trim()) {
    throw new ApiError(
      "Certificate is required for teacher registration",
      [],
      400
    );
  }

  const existedEmail = await User.findOne({ email });
  if (existedEmail) {
    throw new ApiError("Email already exists", [], 400);
  }

  const takenUsername = await User.findOne({ username });
  if (takenUsername) {
    throw new ApiError("Username already taken", [], 400);
  }

  let avatarUrl;
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  if (avatarLocalPath) {
    const uploadedAvatar = await uploadFileOnCloudinary(avatarLocalPath);
    avatarUrl = uploadedAvatar?.url;
  }

  if (!avatarUrl) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    avatarUrl = `${baseUrl}/public/defaultDp.png`;
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName: fullName,
    role: role || "student",
    avatar: avatarUrl,
    certificate: role === "teacher" ? certificate : undefined,
  });

  const token = user.generateToken();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user,
        token,
      },
      "User registered successfully"
    )
  );
});

const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError("please login first", [], 400);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user fetched successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ApiError("Identifier and password are required", [], 400);
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  const user = await User.findOne(
    isEmail ? { email: identifier } : { username: identifier }
  ).select("+password");

  if (!user) {
    throw new ApiError("User does not exist", [], 404);
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError("Invalid credentials", [], 401);
  }

  const token = user.generateToken();

  user.password = undefined;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        token,
      },
      "Login successful"
    )
  );
});

const googleLogin = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) throw new ApiError("Authorization code missing", [], 400);

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const { data } = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }
  );

  const { email, picture, name } = data;

  let user = await User.findOne({ email });
  let newPicture;
  if (picture) {
    newPicture = picture.replace("s96", "s400");
  }

  if (!user) {
    user = await User.create({
      email,
      fullName: name,
      username: `google_${Date.now()}`,
      avatar: newPicture,
      isProfileCompleted: false,
    });
  }

  const token = user.generateToken();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        token,
        isProfileCompleted: user.isProfileCompleted,
      },
      "Google login successful"
    )
  );
});

const completeGoogleSignup = asyncHandler(async (req, res) => {
  const { email, fullName, username, password, role, certificate } = req.body;

  if (!email || !fullName || !username || !password) {
    throw new ApiError("All fields are required", [], 400);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError("Invalid signup request", [], 400);
  }

  if (user.isProfileCompleted) {
    throw new ApiError("Profile already completed", [], 400);
  }

  const usernameTaken = await User.findOne({ username });
  if (usernameTaken) {
    throw new ApiError("Username already taken", [], 400);
  }

  if (role === "teacher" && !certificate?.trim()) {
    throw new ApiError("Certificate required for teacher", [], 400);
  }

  user.fullName = fullName;
  user.username = username;
  user.password = password;
  user.role = role || "student";
  user.certificate = role === "teacher" ? certificate : undefined;
  user.isProfileCompleted = true;

  await user.save();

  const token = user.generateToken();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        token,
      },
      "Signup completed successfully"
    )
  );
});
const getuserProfile = asyncHandler(async (req, res) => {
  const { username } = req.query;
  if (!username) throw new ApiError("username is required", [], 400);
  const user = await User.findOne({ username: username });
  if (!user) throw new ApiError("username does not exists", [], 400);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "user fetched successfully"));
});
const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logout successfully"));
});

const receiveMessage = asyncHandler(async (req, res) => {
  const { message, name, email } = req.body;

  if (!message || !name || !email) {
    throw new ApiError("All fields are required", [], 400);
  }

  if (
    [message, name, email].some(
      (field) => typeof field !== "string" || field.trim() === ""
    )
  ) {
    throw new ApiError("All fields must be valid", [], 400);
  }

  const complaint = {
    message: message.trim(),
    name: name.trim(),
    email: email.trim(),
  };

  const emailContent = `
New Complaint Received:

Name: ${complaint.name}
Email: ${complaint.email}
Message: ${complaint.message}
`;

  const sent = await sendOtpEmail("csekhar2028@gmail.com", emailContent);

  if (!sent) {
    throw new ApiError("Complaint sending failed", [], 500);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Complaint sent successfully"));
});

export {
  generateOtp,
  registerUser,
  verifyOtp,
  getProfile,
  login,
  googleLogin,
  completeGoogleSignup,
  getuserProfile,
  logout,
  receiveMessage,
};
