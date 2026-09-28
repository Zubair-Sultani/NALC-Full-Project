import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const connectDB = () => { mongoose.connect(process.env.MONGO_URL)
.then(()=>{ 
        console.log("connection successed")
}).catch((err) =>{
    console.log(`error ${err}`)
})
}

export default connectDB;