import express from "express";
const router = express.Router();
import studentModel from "../models/student-model.js";
import { authMiddleware, requireRole } from '../middleware/auth_middleware.js';
import multer from "multer";
import path from "path"
import fs from "fs"



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        const newFilename = Date.now() + path.extname(file.originalname);
        cb(null, newFilename)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true)
    } else {
        cb(new Error("Only images are allowed!"), false)
    }
}


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5
    }
})



// Get All Students 
router.get("/", async (req, res) => {
    try {

        const search = req.query.search || ''
        
        const query = {
            $or: [
                {firstName: {$regex: search, $options: "i"}},
                {lastName: {$regex: search, $options: "i"}},
            ]
            
        }

        const students = await studentModel.find(query)
        res.json(students)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})


// Get a single Students 
router.get("/:id", async (req, res) => {
    try {
        const student = await studentModel.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "student not found" });
        res.json(student);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})


// Add new Students 
router.post("/", authMiddleware, requireRole('Administrator','Teacher'), upload.single("profilePic"), async (req, res) => {
    try {

        // const newStudent = await studentModel.create(req.body);
        const newStudent = new studentModel(req.body)

        if (req.file) {
            newStudent.profilePic = req.file.filename;
        }
        await newStudent.save()
        res.status(201).json(newStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})


// Update a Students 
router.put("/:id", authMiddleware, requireRole('Administrator','Teacher'), upload.single("profilePic"), async (req, res) => {
    try {

        const existingStudent = await studentModel.findById(req.params.id)
        if (!existingStudent) {
            if(req.file.filename){
                const filePath = path.join("./uploads", req.file.filename)
                fs.unlink(filePath, (err) => {
                    if (err) console.log("failed to delete image", err)
                })
            }
            return res.status(404).json({ message: "student not found" });
        }
        if (req.file) {
            if (existingStudent.profilePic) {
                const filePath = path.join("./uploads", existingStudent.profilePic)
                fs.unlink(filePath, (err) => {
                    if (err) console.log("failed to delete", err)
                })
            }
            req.body.profilePic = req.file.filename
        }

        const updatedStudent = await studentModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStudent) return res.status(404).json({ message: "student not found" });
        res.json(updatedStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})


// Delete a Students 
router.delete("/:id", authMiddleware, requireRole('Administrator'), async (req, res) => {
    try {
        const student = await studentModel.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: "student not found" });

        if (student.profilePic) {
            const filePath = path.join("./uploads", student.profilePic)
            fs.unlink(filePath, (err) => {
                if (err) console.log("failed to delete", err)
            })
        }

        res.json({ message: "student deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

export default router