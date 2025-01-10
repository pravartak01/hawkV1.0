import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

console.log(process.env.MONGODB_URI, "my path");

const connectDB = async () =>{
    try{
        const connection_instance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected ! DB host: ${connection_instance.connection.host}`);
        
    } catch(error){
        console.log("MongoDB connection error ", error);
        process.exit(1);
    }
}

export default connectDB;
