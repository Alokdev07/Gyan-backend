import jwt from "jsonwebtoken";
import User from "../model/user.model.js";
import { ApiError } from "../utilities/ApiError.js";

const verifyJwt = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new ApiError("Unauthorized. Token missing.", [], 401);
    }

    const decoded = jwt.verify(token, process.env.TOKENKEYSECRET);

    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      throw new ApiError("User not found. Invalid token.", [], 401);
    }

    req.user = user;
    next();
  } catch (error) {
    
    if (error.name === "TokenExpiredError") {
      return next(new ApiError("Token expired. Please login again.", [], 401));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new ApiError("Invalid token.", [], 401));
    }

    next(error);
  }
};

export { verifyJwt };
