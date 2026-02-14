import { Router } from 'express'
import {generateOtp, verifyOtp,registerUser, getProfile, login, googleLogin,completeGoogleSignup, getuserProfile,logout, receiveMessage} from '../controllers/user.controller.js'
import {upload} from '../middleware/multer.middleware.js'
import {verifyJwt} from '../middleware/auth.middleware.js'
import {authorizeRoles} from '../middleware/authorizeRoles.middleware.js'
import { logoutUser } from '../../../client/src/store/authslice/userSlice.js'

const route = Router()

route.post("/verifyEmail",generateOtp)
route.post("/verifyOtp",verifyOtp)
route.post(
  "/signup",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  registerUser
);
route.get('/getProfile',verifyJwt,getProfile)
route.post("/login", (req, res, next) => {
  console.log("LOGIN ROUTE HIT");
  next();
}, login);
route.get("/googleLogin",googleLogin)
route.post(
  "/complete-google-signup",
  completeGoogleSignup
);
route.get("/getUser",getuserProfile)
route.get("/logout",logout)
route.post("/getComplaint",receiveMessage)





export default route