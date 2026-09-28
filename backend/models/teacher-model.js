import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    firstName:{
        type: String,
        require: true
    },
    Id:{
        type: String,
        require: true,
        unique: true
    },
    lastName: {
        type: String,
        require: true
    },
    fatherName: {
        type: String,
        require: true
    },
    subject: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    phone: {
        type: String,
        require: true
    },
    address: {
        type: String,
        require: true
    },
    notes: {
        type: String,
        require: true
    },
    salary: {
        type: String,
        require: true
    },
    qualification: {
        type: String,
        require: true
    },
    experience: {
        type: String,
        require: true
    },
    joinDate: {
        type: Date,
        require: true,
        default: Date.now
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        require: true
    },
    status: {
        type: String,
        require: true
    },
   profilePic:{
        type: String
    }

})

export default mongoose.model("teacher", teacherSchema);