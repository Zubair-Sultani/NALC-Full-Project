import express, { urlencoded, json } from 'express';
const app = express();
import path from "path"
import studentRoutes from "./routes/student_routes.js";
import teacherRoutes from "./routes/teacher_routes.js";
import courseRoutes from "./routes/course_routes.js";
import noticeRoutes from "./routes/notice_routes.js";
import authRoutes from "./routes/auth_routes.js";
import feeRoutes from "./routes/fee_routes.js";
import salaryRoutes from "./routes/salary_routes.js";
import attendanceRoutes from "./routes/attendance_routes.js";
import connectDB from './config/database.js';
import cors from "cors"
import { fileURLToPath } from 'url';
import { MulterError } from 'multer';
import bcrypt from 'bcryptjs';
import User from './models/user-model.js';
import Course from './models/course-model.js';
import Teacher from './models/teacher-model.js';
import Student from './models/student-model.js';
import Fee from './models/fee-model.js';
import Salary from './models/salary-model.js';
import Attendance from './models/attendance-model.js';
import Notice from './models/notice-model.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000

async function startServer() {
  await connectDB();
  await ensureAdminUser();
  await ensureInitialData();

  app.use(urlencoded({extended: true}));
  app.use(json());
  app.set("view engine", "ejs");
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
  app.use(cors())
  app.use("/api/students", studentRoutes);
  app.use("/api/teachers", teacherRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/notices", noticeRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/fees", feeRoutes);
  app.use("/api/salaries", salaryRoutes);
  app.use("/api/attendance", attendanceRoutes);

  app.use((error, req, res, next) =>{
      if(error instanceof MulterError){
          return res.status(400).send(`Image error: ${error.message} : ${error.code}`)
      }else if(error){
          return res.status(500).send(`something went wrong: ${error.message}`)
      }
      next()
  })

  app.get("/", (req, res) =>[
      res.send("Hello world!")
  ])

  app.listen(PORT, ()=>{
      console.log(`Server is running on port ${PORT}`)
  })
}

async function ensureAdminUser() {
  try {
    const password = '123';
    const admin = await User.findOne({ username: 'admin' });
    const hash = await bcrypt.hash(password, 10);
    if (admin) {
      admin.passwordHash = hash;
      admin.role = 'Administrator';
      admin.name = admin.name || 'Admin';
      await admin.save();
      // console.log('Reset admin password to 123');
    } else {
      await User.create({ username: 'admin', passwordHash: hash, role: 'Administrator', name: 'Admin' });
      console.log('Created admin account: admin / 123');
    }
  } catch (err) {
    console.error('Failed to ensure admin user:', err.message);
  }
}

async function ensureInitialData() {
  try {
    const [courseCount, teacherCount, studentCount, feeCount, salaryCount, attendanceCount, noticeCount] = await Promise.all([
      Course.countDocuments(),
      Teacher.countDocuments(),
      Student.countDocuments(),
      Fee.countDocuments(),
      Salary.countDocuments(),
      Attendance.countDocuments(),
      Notice.countDocuments()
    ]);

    const created = { teachers: [], courses: [], students: [] };

    if (!teacherCount) {
      created.teachers = await Teacher.create([
        {
          firstName: 'Noor',
          lastName: 'Aziz',
          Id: 'T001',
          fatherName: 'Omar Aziz',
          email: 'noor.aziz@example.com',
          phone: '03001234567',
          address: 'Kabul',
          notes: 'Math teacher',
          salary: '45000',
          qualification: 'MSc Mathematics',
          experience: '5 years',
          gender: 'Female',
          status: 'Active'
        },
        {
          firstName: 'Sami',
          lastName: 'Hamid',
          Id: 'T002',
          fatherName: 'Faiz Hamid',
          email: 'sami.hamid@example.com',
          phone: '03007654321',
          address: 'Herat',
          notes: 'Physics teacher',
          salary: '42000',
          qualification: 'MSc Physics',
          experience: '4 years',
          gender: 'Male',
          status: 'Active'
        }
      ]);
    } else {
      created.teachers = await Teacher.find().sort({ joinDate: 1 }).limit(2);
    }

    if (!courseCount) {
      const teacherIds = created.teachers.map(t => t._id.toString());
      created.courses = await Course.create([
        {
          name: 'Computer Science',
          code: 'CS101',
          teacher: teacherIds[0] || '',
          duration: '6 months',
          start: '2026-08-01',
          end: '2027-01-31',
          fee: '25000',
          max: 30,
          status: 'Active',
          schedule: 'Mon/Wed/Fri',
          desc: 'Introductory computer science course'
        },
        {
          name: 'English Language',
          code: 'ENG101',
          teacher: teacherIds[1] || '',
          duration: '4 months',
          start: '2026-08-15',
          end: '2026-12-15',
          fee: '20000',
          max: 25,
          status: 'Active',
          schedule: 'Tue/Thu',
          desc: 'English grammar and communication skills'
        }
      ]);
    } else {
      created.courses = await Course.find().sort({ name: 1 }).limit(2);
    }

    if (!studentCount) {
      const courseIds = created.courses.map(c => c._id.toString());
      created.students = await Student.create([
        {
          firstName: 'Amina',
          lastName: 'Khan',
          Id: 'S001',
          fatherName: 'Yusuf Khan',
          email: 'amina.khan@example.com',
          phone: '0700123456',
          address: 'Kabul',
          notes: 'Excellent performance',
          fee: '25000',
          dob: '2006-05-12',
          admDate: '2026-08-01',
          gender: 'Female',
          course: courseIds[0] || '',
          status: 'Active'
        },
        {
          firstName: 'Bilal',
          lastName: 'Ahmad',
          Id: 'S002',
          fatherName: 'Hamid Ahmad',
          email: 'bilal.ahmad@example.com',
          phone: '0700654321',
          address: 'Herat',
          notes: 'Needs improvement',
          fee: '20000',
          dob: '2005-09-22',
          admDate: '2026-08-15',
          gender: 'Male',
          course: courseIds[1] || '',
          status: 'Active'
        }
      ]);
    } else {
      created.students = await Student.find().sort({ admDate: 1 }).limit(2);
    }

    if (!feeCount && created.students.length) {
      await Fee.create([
        {
          studentId: created.students[0]._id,
          studentName: `${created.students[0].firstName} ${created.students[0].lastName}`,
          course: created.students[0].course,
          amount: 10000,
          date: '2026-08-05',
          method: 'Cash',
          status: 'Paid',
          notes: 'First installment'
        },
        {
          studentId: created.students[1]._id,
          studentName: `${created.students[1].firstName} ${created.students[1].lastName}`,
          course: created.students[1].course,
          amount: 5000,
          date: '2026-08-10',
          method: 'Bank Transfer',
          status: 'Pending',
          notes: 'Partial payment'
        }
      ]);
    }

    if (!salaryCount && created.teachers.length) {
      await Salary.create([
        {
          teacherId: created.teachers[0]._id,
          teacherName: `${created.teachers[0].firstName} ${created.teachers[0].lastName}`,
          month: '2026-08',
          amount: 45000,
          bonus: 2000,
          deduct: 0,
          net: 47000,
          status: 'Paid',
          notes: 'August salary'
        },
        {
          teacherId: created.teachers[1]._id,
          teacherName: `${created.teachers[1].firstName} ${created.teachers[1].lastName}`,
          month: '2026-08',
          amount: 42000,
          bonus: 0,
          deduct: 500,
          net: 41500,
          status: 'Paid',
          notes: 'August salary'
        }
      ]);
    }

    if (!attendanceCount && created.students.length && created.teachers.length) {
      await Attendance.create([
        {
          date: '2026-09-01',
          kind: 'student',
          records: {
            [created.students[0]._id]: 'present',
            [created.students[1]._id]: 'absent'
          }
        },
        {
          date: '2026-09-01',
          kind: 'teacher',
          records: {
            [created.teachers[0]._id]: 'present',
            [created.teachers[1]._id]: 'present'
          }
        }
      ]);
    }

    if (!noticeCount) {
      await Notice.create([
        {
          title: 'Welcome to NALC',
          cat: 'General',
          date: '2026-08-01',
          msg: 'This system is now connected to MongoDB. All course, student, teacher, fee, salary, attendance, and notice data is loaded from the database.'
        },
        {
          title: 'Classes Starting Soon',
          cat: 'Event',
          date: '2026-08-10',
          msg: 'New term classes will begin on 15th August. Please ensure student enrollments are complete.'
        }
      ]);
    }

    if (courseCount || teacherCount || studentCount || feeCount || salaryCount || attendanceCount || noticeCount) {
      console.log('Initial data check completed. Existing MongoDB collections were preserved.');
    } else {
      console.log('Seeded initial MongoDB data for courses, teachers, students, fees, salaries, attendance, and notices.');
    }
  } catch (err) {
    console.error('Initial data seed failed:', err.message || err);
  }
}

startServer();