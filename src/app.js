import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser'
import path from 'path'
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import helmet from "helmet";


const app = express();

app.use(
  cors({
    origin: [process.env.CLIENT_URL,"http://localhost:5173"],
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "20kb"
  })
);

app.use(helmet())

app.set("trust proxy", 1);

app.use(express.urlencoded({
    extended : true,
    limit : '20kb'
}))

app.use("/public", express.static(("public")));

app.use(cookieParser())



// routes

import userRoute from './routes/user.route.js'
import quizRoute from './routes/question.route.js'
import attemptRoute from './routes/attempt.route.js'


app.use("/api/v1/user",userRoute)
app.use("/api/v1/quiz",quizRoute)
app.use("/api/v1/attempt",attemptRoute)

app.use(errorHandler)

export { app };
