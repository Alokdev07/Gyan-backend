import { app } from "./app.js";
import connectDB from "./database/index.js";
import dotenv from 'dotenv'

dotenv.config()


connectDB()
   .then(() => {
    app.listen(process.env.PORT || 8000 , () => {
      console.log(`server is listening in ${process.env.PORT}`)
    }
    )
   })
   .catch((err) => {
    console.log(err)
   })