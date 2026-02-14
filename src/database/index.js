import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
 try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODBURI}`)
    console.log(`\n Mongodb connected !! Db host : ${connectionInstance.connection.host}`)
 } catch (error) {
    console.error("Error in mongodb connection " , error)
    process.exit(1)
 }  
}

export default connectDB