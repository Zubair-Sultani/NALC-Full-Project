Noor Ali Educational Center — Management Information System

A full-stack Educational Management Information System (EMIS) for managing students, teachers, courses, attendance, fees, salaries, notices, users, and administrative settings.

The application provides a dashboard-based interface with role-based access for Administrators, Teachers, and Students. The frontend uses HTML, CSS, and JavaScript, while the backend provides the server-side API, authentication, database operations, and application routes.

Project status: This README describes the application structure and functionality visible in the project. Backend route names, database configuration, and exact package commands should be adjusted to match the implementation in the backend files.

✨ Features

🔐 Authentication & User Management

User login with username and password

Role selection:

Administrator

Teacher

Student

User registration

Password visibility toggle

Logout functionality

Role-based access control

Authentication handled through the backend/API

📊 Dashboard

The dashboard provides an overview of the education center, including:

Total students

Total teachers

Total courses

Pending fees

Recent enrollments

Recent notices

Monthly attendance overview

Quick actions for common operations

👨‍🎓 Student Management

Add students

Edit student information

View student profiles

Delete student records

Search students

Filter students by status

Filter students by course

Export student records to CSV

Print student lists

Store student contact and enrollment information

Student admission date and course assignment

Fee information and notes

👨‍🏫 Teacher Management

Add teachers

Edit teacher information

View teacher profiles

Delete teacher records

Search teachers

Filter teachers by status

Export teacher records to CSV

Print teacher lists

Store teacher qualification and experience

Subject/department assignment

Salary information

Teacher status management

📚 Course Management

Add courses

Edit courses

Delete courses

Assign teachers to courses

Course code management

Course duration

Start and end dates

Course fees

Maximum student capacity

Course schedule

Course description

Course status:

Active

Upcoming

Completed

✅ Student Attendance

Select attendance date

Select course/class

Load students

Mark students present

Mark students absent

Mark students late

Save attendance

Display attendance summary

Print attendance

📋 Teacher Attendance

Select attendance date

Filter by department/subject

Load teachers

Mark teachers present

Mark teachers absent

Mark teachers late

Save attendance

Display attendance summary

Print attendance

📈 Attendance Reports

Generate attendance reports

Select reporting date range

View generated report

Print attendance reports

💰 Fee Management

Record student fee payments

Select student

Enter payment amount

Payment date

Payment method:

Cash

Bank Transfer

Cheque

Online

Payment status:

Paid

Partial

Pending

Add payment notes

View fee records

Print fee records

💳 Teacher Salary Management

Record teacher salary payments

Select teacher

Select salary month

Base salary

Bonus

Deduction

Calculate/display net pay

Salary status:

Paid

Pending

Salary notes

Print salary records

📢 Notice Board

Create notices

Edit notices

Delete notices

Notice title

Notice category

Notice date

Notice message

Categories such as:

General

Exam

Holiday

Fee

Event

⚙️ Settings

Education center information

Center name

Address

Phone

Email

Password update interface

System statistics

🖨️ Printing & Export

Print dashboard information

Print student lists

Print teacher lists

Print attendance

Print reports

Print fee records

Print salary records

Export student and teacher data to CSV

🛠️ Technologies

Frontend

HTML5

CSS3

JavaScript

Responsive UI

Browser DOM APIs

Fetch/API requests

CSV export

Print functionality

The frontend entry page loads the application's stylesheet from stylesheets/app.css and the main JavaScript from javascript/app.js. fileciteturn0file0L4-L8 fileciteturn0file0L1026-L1033

Backend

The backend is responsible for:

REST API endpoints

Authentication

User management

Student CRUD operations

Teacher CRUD operations

Course CRUD operations

Attendance

Fees

Salaries

Notices

Database communication

Validation

Error handling

Authorization

Update this section with the exact backend framework used by the project, such as Node.js/Express, and the exact database used by the application.

Database

The application requires persistent storage for entities such as:

Users

Students

Teachers

Courses

Student attendance

Teacher attendance

Fee payments

Salary payments

Notices

System settings

Replace this section with the exact database technology used in your backend, for example MongoDB, MySQL, or PostgreSQL.

📁 Suggested Project Structure

noor-ali-educational-center/
│
├── frontend/
│   ├── index.html
│   │
│   ├── stylesheets/
│   │   └── app.css
│   │
│   └── javascript/
│       └── app.js
│
├── backend/
│   ├── server.js
│   ├── app.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── student.routes.js
│   │   ├── teacher.routes.js
│   │   ├── course.routes.js
│   │   ├── attendance.routes.js
│   │   ├── fee.routes.js
│   │   ├── salary.routes.js
│   │   ├── notice.routes.js
│   │   └── settings.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── teacher.controller.js
│   │   ├── course.controller.js
│   │   ├── attendance.controller.js
│   │   ├── fee.controller.js
│   │   ├── salary.controller.js
│   │   └── notice.controller.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Course.js
│   │   ├── Attendance.js
│   │   ├── Fee.js
│   │   ├── Salary.js
│   │   └── Notice.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── role.js
│   │   └── errorHandler.js
│   │
│   ├── config/
│   │   └── database.js
│   │
│   └── .env
│
├── .gitignore
├── package.json
└── README.md

Rename the files/directories above to match your actual repository. This structure is a documentation template for a typical full-stack implementation, not a claim that every listed file already exists.

🔄 Application Flow

User
  │
  ▼
Login / Registration
  │
  ▼
Authentication API
  │
  ├── Invalid credentials ──► Error message
  │
  └── Valid credentials
          │
          ▼
       Dashboard
          │
          ├── Students
          ├── Teachers
          ├── Courses
          ├── Attendance
          ├── Fees
          ├── Salaries
          ├── Notices
          └── Settings
                  │
                  ▼
              Backend API
                  │
                  ▼
               Database

🔌 API / Backend Routes

The backend should expose API routes for the main resources.

Authentication

POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout

Users

GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id

Students

GET    /api/students
GET    /api/students/:id
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id

Teachers

GET    /api/teachers
GET    /api/teachers/:id
POST   /api/teachers
PUT    /api/teachers/:id
DELETE /api/teachers/:id

Courses

GET    /api/courses
GET    /api/courses/:id
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id

Attendance

GET    /api/attendance
POST   /api/attendance
PUT    /api/attendance/:id
DELETE /api/attendance/:id

Fees

GET    /api/fees
POST   /api/fees
PUT    /api/fees/:id
DELETE /api/fees/:id

Salaries

GET    /api/salaries
POST   /api/salaries
PUT    /api/salaries/:id
DELETE /api/salaries/:id

Notices

GET    /api/notices
POST   /api/notices
PUT    /api/notices/:id
DELETE /api/notices/:id

Settings

GET    /api/settings
PUT    /api/settings

Important: These are documented REST-style route suggestions. Replace them with the exact routes implemented in your backend before publishing the repository.

🔑 Environment Variables

Create a .env file in the backend directory.

Example:

PORT=5000
NODE_ENV=development

DATABASE_URL=your_database_connection_string

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:3000

If using MongoDB:

MONGO_URI=your_mongodb_connection_string

Never commit your .env file to GitHub.

Add it to .gitignore:

.env
.env.local
node_modules/

🚀 Installation

1. Clone the repository

git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY

2. Install backend dependencies

cd backend
npm install

3. Configure environment variables

Create:

backend/.env

and add your database URL, JWT secret, port, and other required configuration.

4. Start the backend

For development:

npm run dev

Or:

npm start

5. Run the frontend

If the frontend is plain HTML/CSS/JavaScript, you can serve it using a local development server such as VS Code Live Server.

If the frontend has its own package.json, install its dependencies and use the project's frontend start command.

🔐 Security

Before deploying the application:

Never commit passwords.

Never commit API keys.

Never commit database credentials.

Never commit JWT secrets.

Use environment variables for secrets.

Hash passwords before storing them.

Validate incoming API data.

Protect private API routes with authentication middleware.

Implement role-based authorization.

Configure CORS correctly.

Use HTTPS in production.

Do not use demo credentials in production.

The UI currently displays demo login credentials in the login screen, so these should be removed or changed before deploying a production system. fileciteturn0file0L39-L45

👥 User Roles

Role

Typical Responsibilities

Administrator

Manage users, students, teachers, courses, attendance, fees, salaries, notices and settings

Teacher

View assigned courses/students and manage permitted academic/attendance functions

Student

View permitted personal/course/attendance information

The exact permissions should be enforced on the backend, not only hidden in the frontend.

📱 Responsive Design

The interface is designed as an administrative dashboard with:

Sidebar navigation

Top navigation bar

Cards

Tables

Forms

Modal dialogs

Search and filtering

Dashboard statistics

Print-friendly views

The application includes separate sections for dashboard, students, teachers, courses, attendance, finance, notices, and settings. fileciteturn0file0L86-L138

🗃️ Main Data Entities

A typical database design for this system contains:

User
 ├── role
 ├── username
 └── password

Student
 ├── studentId
 ├── name
 ├── fatherName
 ├── contact
 ├── course
 ├── admissionDate
 ├── status
 └── fee

Teacher
 ├── teacherId
 ├── name
 ├── fatherName
 ├── subject
 ├── qualification
 ├── experience
 ├── salary
 └── status

Course
 ├── name
 ├── code
 ├── teacher
 ├── duration
 ├── startDate
 ├── endDate
 ├── fee
 └── status

Attendance
 ├── person
 ├── date
 ├── type
 └── status

Fee
 ├── student
 ├── amount
 ├── date
 ├── method
 └── status

Salary
 ├── teacher
 ├── month
 ├── salary
 ├── bonus
 ├── deduction
 └── status

Notice
 ├── title
 ├── category
 ├── date
 └── message

🧪 Testing Checklist

Before deployment, test:

User registration

Login with valid credentials

Login with invalid credentials

Logout

Authentication persistence after refresh

Role permissions

Add student

Edit student

Delete student

Search/filter students

Add teacher

Edit teacher

Delete teacher

Add/edit/delete courses

Student attendance

Teacher attendance

Attendance reports

Fee payments

Teacher salary

Notices

Settings

CSV export

Printing

Mobile responsiveness

API error handling

Database connection

Production environment variables

🏗️ Future Improvements

Potential improvements include:

Advanced role and permission management

Student/teacher profile photos

SMS notifications

Email notifications

Online fee payment

PDF report generation

Advanced financial reports

Student result/grade management

Examination management

Class timetable

Parent accounts

Student portal

Teacher portal

Backup and restore

Audit logs

Advanced analytics

Multi-language support

Dark/light theme

Cloud deployment

Automated testing

🤝 Contributing

Contributions are welcome.

Fork the repository.

Create a feature branch.

git checkout -b feature/your-feature

Make your changes.

Commit your changes.

git commit -m "Add your feature"

Push the branch.

git push origin feature/your-feature

Open a Pull Request.

📄 License

Add the license that applies to your project.

For example:

MIT License

If this is a private/client project, do not add an open-source license unless the project owner intends to release the source code under that license.

👨‍💻 Author

Sultani

Full-Stack Web Developer

GitHub: https://github.com/Zubair-Sultani

⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.
