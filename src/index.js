import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { app } from "./app.js";

import connectDB from "./db/index.js";

const PORT = process.env.PORT || 7002;

connectDB()
.then(
    app.listen(PORT, ()=>{
        console.log(`The server is live on port: ${PORT}`); 
    })
)
.catch((err) =>{
    console.log(("Mongodb connection error", err));
})