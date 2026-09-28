import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
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
    fee: {
        type: String,
        require: true
    },
    dob: {
        type: Date,
        require: true
    },
    admDate: {
        type: Date,
        require: true,
        default: Date.now()
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        require: true
    },
    course: {
        type: String,
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

export default mongoose.model("student", studentSchema);