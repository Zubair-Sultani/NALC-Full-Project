
// removed stray test fetch (was causing 404s during app load)

/* ══════════════════════════════════════
   CLIENT CACHE (MongoDB-backed)
   This object is only a temporary in-memory cache for UI rendering.
   All real data is loaded from MongoDB via server APIs.
══════════════════════════════════════ */
let db = { students: [], teachers: [], courses: [], studentAttendance: {}, teacherAttendance: {}, fees: [], salaries: [], notices: [] };

// Persistence removed: frontend now uses server APIs. Keep no-op functions temporarily during migration.
function save() { /* no-op: migrated to server */ }
function load() { /* no-op: migrated to server */ }



/* ══════════════════════════════════════
   AUTH (server-backed)
══════════════════════════════════════ */
let currentRole = null, currentUser = null;
let authToken = null, authUser = null;

function setToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}
function getToken() {
  return authToken || localStorage.getItem('token');
}

function setUserInfo(user) {
  authUser = user;
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
}
function getUserInfo() {
  if (authUser) return authUser;
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch (e) {
    return null;
  }
}

const API_BASE = 'http://localhost:5000';

// attach token to all fetch calls and route API requests to backend
const _nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = API_BASE + input;
  }
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', 'Bearer ' + token);
  const cfg = Object.assign({}, init, { headers });
  return _nativeFetch(input, cfg);
};

async function setUIForUser(user) {
  currentUser = user?.username || null;
  currentRole = user?.role || null;
  if (user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
    document.getElementById('sidebarAvatar').textContent = (user.username || 'U')[0].toUpperCase();
    document.getElementById('sidebarName').textContent = user.name || user.username;
    document.getElementById('sidebarRole').textContent = user.role || '';
    await initApp();
  } else {
    document.getElementById('appShell').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    const userInput = document.getElementById('loginUser');
    const passInput = document.getElementById('loginPass');
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
  }
  applyPermissions();
}

async function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const role = document.getElementById('loginRole').value;
  const err = document.getElementById('loginError');
  err.textContent = '';
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p, role })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      err.textContent = j.message || '✕ Invalid username, password, or role.';
      return;
    }
    const data = await res.json();
    if (data.user.role !== role) {
      err.textContent = '✕ Please select the correct role for this account.';
      return;
    }
    setToken(data.token);
    setUserInfo(data.user);
    await setUIForUser(data.user);
  } catch (e) {
    err.textContent = 'Login failed';
  }
  applyPermissions();
}

async function doRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const name = document.getElementById('regName').value.trim();
  const role = document.getElementById('regRole').value;
  const err = document.getElementById('registerError');
  err.textContent = '';
  if (!username || !password) {
    err.textContent = 'Username and password are required.';
    return;
  }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, role })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      err.textContent = j.message || 'Registration failed.';
      return;
    }
    const modal = document.getElementById('modalRegister');
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regName').value = '';
    closeModal('modalRegister');
    showToast('User created successfully. Use login form to sign in.');
  } catch (e) {
    err.textContent = 'Registration failed.';
  }
}

function logout() {
  setToken(null); setUserInfo(null);
  currentUser = null; currentRole = null;
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

function togglePassword() {
  const pass = document.getElementById('loginPass');
  const btn = document.querySelector('.passwordToggle');
  if (!pass || !btn) return;
  pass.type = pass.type === 'password' ? 'text' : 'password';
  btn.textContent = pass.type === 'password' ? 'Show' : 'Hide';
}

// Expose handlers to global scope for inline `onclick` attributes in index.html
window.doLogin = doLogin;
window.doRegister = doRegister;
window.logout = logout;
window.togglePassword = togglePassword;






/* ══════════════════════════════════════
   APP INIT
══════════════════════════════════════ */
async function initApp() {
  await Promise.all([fetchCourses(), fetchTeachers(), fetchStudents(), fetchNotices(), fetchFees(), fetchSalaries()]);
  setTodayDates();
  updateTopDate();
  showPage('dashboard');
  renderAll();
  saveTeacher();
  saveStudent();
  saveNotice();
}

function updateTopDate() {
  const now = new Date();
  document.getElementById('topDate').textContent = now.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function setTodayDates() {
  const today = new Date().toISOString().split('T')[0];
  ['attStudDate', 'attTeachDate', 'repFrom', 'repTo', 'feeDate', 'notDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
  const nm = document.getElementById('salMonth');
  if (nm) nm.value = today.slice(0, 7);
}

function renderAll() {
  renderStudents();
  renderTeachers();
  renderCourses();
  renderFees();
  renderSalaries();
  renderNotices();
  updateDashboard();
  updateNavBadges();
  refreshDropdowns();
  updateSettingsStats();
  applyPermissions();
}




/* ══════════════════════════════════════
   NAVIGATION
══════════════════════════════════════ */
const pageTitles = {
  dashboard: 'Dashboard', students: 'Students', teachers: 'Teachers',
  courses: 'Courses', studentAttendance: 'Student Attendance',
  teacherAttendance: 'Teacher Attendance', attendanceReport: 'Attendance Report',
  fees: 'Fee Management', salary: 'Teacher Salary', notices: 'Notice Board', settings: 'Settings'
};

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.navItem').forEach(n => n.classList.remove('active'));
  document.getElementById('pg-' + id)?.classList.add('active');
  document.querySelectorAll('.navItem').forEach(n => { if (n.textContent.trim().toLowerCase().includes(pageTitles[id]?.split(' ')[0]?.toLowerCase() || '')) n.classList.add('active'); });
  document.getElementById('pageTitle').textContent = pageTitles[id] || id;
  if (id === 'studentAttendance' || id === 'teacherAttendance') refreshAttendanceDropdowns();
  if (id === 'attendanceReport') generateReport();
}




/* ══════════════════════════════════════
   MODALS
══════════════════════════════════════ */
async function openModal(id) {
  try {
    await refreshDropdowns();
  } catch (e) { /* ignore */ }
  document.getElementById(id).classList.add('open');
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modalOverlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));




/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
function showToast(msg, color = '#1A6B4A') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.background = color; t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}




/* ══════════════════════════════════════
   COLORS
══════════════════════════════════════ */
const COLORS = ['#1A6B4A', '#C9963A', '#1D4ED8', '#DC2626', '#7C3AED', '#0891B2', '#D97706', '#059669'];
function avatarColor(name) {
  if (!name) return COLORS[0];
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

function initials(name) { return (name || '').split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2); }





/* ══════════════════════════════════════
   STUDENTS
══════════════════════════════════════ */
function clearStudentForm() {
  ['editStudentId', 'sId', 'sfName', 'slName', 'sFather', 'sDOB', 'sPhone', 'sEmail', 'sAddress', 'sNotes', 'sFee', 'sCourse'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const gender = document.getElementById('sGender'); if (gender) gender.value = 'Male';
  const status = document.getElementById('sStatus'); if (status) status.value = 'Active';
  const adm = document.getElementById('sAdmDate'); if (adm) adm.value = new Date().toISOString().split('T')[0];
  const title = document.getElementById('studentModalTitle'); if (title) title.textContent = 'Add New Student';
}

function saveStudent() {
  const studentForm = document.getElementById("Addstudent");
  if (!studentForm || studentForm.dataset.listenerAttached) return;
  studentForm.dataset.listenerAttached = 'true';

  studentForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const suId = document.getElementById('editStudentId').value;
    const formData = new FormData(this);

    if (suId) {
      const response = await fetch(`http://localhost:5000/api/students/${suId}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        this.reset();
        closeModal("modalStudent");
        showToast('Student updated!');
        renderStudents();
      } else {
        alert("Error Updating student");
        this.reset();
      }
    } else {
      const res = await fetch(`http://localhost:5000/api/students`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        this.reset();
        renderStudents();
        closeModal('modalStudent');
        showToast('Student added!');
      } else {
        alert("Error creating student");
      }
    }
  });
}
async function editStudent(id) {
  const apiUrl = `http://localhost:5000/api/students/${id}`;
  const res = await fetch(apiUrl);
  const student = await res.json();


  document.getElementById('editStudentId').value = student._id;
  document.getElementById('sfName').value = student.firstName; document.getElementById('sId').value = student.Id || '';
  document.getElementById('slName').value = student.lastName || ""; document.getElementById('sFather').value = student.fatherName || '';
  document.getElementById('sDOB').value = student.dob || ''; document.getElementById('sGender').value = student.gender || 'Male';
  document.getElementById('sPhone').value = student.phone; document.getElementById('sEmail').value = student.email || '';
  document.getElementById('sCourse').value = student.course || ''; document.getElementById('sAdmDate').value = student.admDate || '';
  document.getElementById('sStatus').value = student.status || 'Active'; document.getElementById('sFee').value = student.fee || '';
  document.getElementById('sAddress').value = student.address || ''; document.getElementById('sNotes').value = student.notes || '';
  document.getElementById('studentModalTitle').textContent = 'Edit Student';
  openModal('modalStudent');

}

async function deleteStudent(id) {
  if (confirm("Are you sure to delete this record?")) {
    await fetch(`http://localhost:5000/api/students/${id}`, { method: 'DELETE' })
    renderStudents(); showToast('Student deleted.', '#DC2626');
  }
};

async function viewStudent(id) {
  const apiUrl = `http://localhost:5000/api/students/${id}`;
  const res = await fetch(apiUrl);
  const student = await res.json();
  
  
  // Resolve course name from client cache (match by id, code, or name)
  let courseName = '—';
  if (student.course) {
    const byId = db.courses.find(c => c.id == student.course || c.id == student.course?._id);
    const byCode = db.courses.find(c => c.code && c.code.toLowerCase() == String(student.course).toLowerCase());
    const byName = db.courses.find(c => c.name && c.name.toLowerCase() == String(student.course).toLowerCase());
    const co = byId || byCode || byName;
    courseName = co ? co.name : student.course;
  }

  // const s = db.students.find(x => x.id == id); if (!s) return;
  // const course = db.courses.find(c => c.id == s.course);
  // const fees = db.fees.filter(f => f.studentId == id);
  // const totalPaid = fees.reduce((a, f) => a + (+f.amount || 0), 0);
  // const att = Object.entries(db.studentAttendance).map(([date, rec]) => ({ date, status: rec[id] })).filter(x => x.status);
  // const presentDays = att.filter(x => x.status === 'present').length;
  // const bg = avatarColor(s.name);

  document.getElementById('studentDetailBody').innerHTML = `
    <div class="profileHeader">
      <div class="profileAvatar" >${initials(student.firstName)}</div>
      <div>
        <div class="profileName">${student.firstName} ${student.lastName || '__'}</div>
        <div class="profileSub">ID:${student.Id} &nbsp;|&nbsp; ${student.phone}</div>
        <div style="margin-top:8px"><span class="badge ${student.status === 'Active' ? 'badge-green' : 'badge-red'}">${student.status}</span></div>
      </div>
    </div>
    <div class="infoGrid" style="margin-bottom:20px">
      <div class="infoItem"><div class="ilabel">Father's Name</div><div class="ivalue">${student.fatherName || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Date of Birth</div><div class="ivalue">${student.dob || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Gender</div><div class="ivalue">${student.gender || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Email</div><div class="ivalue">${student.email || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Course</div><div class="ivalue">${courseName}</div></div>
      <div class="infoItem"><div class="ilabel">Admission Date</div><div class="ivalue">${student.admDate || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Address</div><div class="ivalue">${student.address || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Attendance</div><div class="ivalue"> '_' days</div></div>
      <div class="infoItem"><div class="ilabel">Total Fees Paid</div><div class="ivalue" style="color:var(--emerald)">AFG 1000</div></div>
      <div class="infoItem"><div class="ilabel">Notes</div><div class="ivalue">${student.notes || '—'}</div></div>
    </div>`;
  openModal('modalViewStudent');

}

async function renderStudents() {

  const apiUrl = "http://localhost:5000/api/students";
  const res = await fetch(apiUrl);
  const data = await res.json();

  const tbody = document.getElementById('studentTBody');
  tbody.innerHTML = ""
  if (data.length <= 0) { tbody.innerHTML = '<tr><td colspan="7"><div class="emptyState"><div class="emptyIcon">👨‍🎓</div><p>No students yet. Add your first student!</p></div></td></tr>'; return; }
  else {
    data.forEach((student, index) => {
      const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.Id || 'Student';
      // Resolve course name from client cache (match by id, code, or name)
      let courseName = '—';
      if (student.course) {
        const byId = db.courses.find(c => c.id == student.course || c.id == student.course?._id);
        const byCode = db.courses.find(c => c.code && c.code.toLowerCase() == String(student.course).toLowerCase());
        const byName = db.courses.find(c => c.name && c.name.toLowerCase() == String(student.course).toLowerCase());
        const co = byId || byCode || byName;
        courseName = co ? co.name : student.course;
      }
      tbody.innerHTML += `<tr>
      <td><div class="nameCell"><div class="avatar" style="background:${avatarColor(name)}">${initials(name)}</div>${name}</div></td>
      <td>${student.Id}</td><td>${student.phone}</td>
      <td>${courseName}</td>
      <td><span class="badge ${student.status === 'Active' ? 'badge-green' : 'badge-red'}">${student.status}</span></td>
      <td>${student.fee ? 'AFG ' + student.fee : '—'}</td>
      <td>
        <div class="btnGroup">
          <button class="btn btn-outline btn-sm" onclick="viewStudent('${student._id}')">👁</button>
          <button class="btn btn-gold btn-sm" onclick="editStudent('${student._id}')">✏️</button>
          <button class="btn btn-red btn-sm" onclick="deleteStudent('${student._id}')">🗑️</button>
        </div>
      </td>
      </tr>`;
    });
  }
}










/* ══════════════════════════════════════
   TEACHERS
══════════════════════════════════════ */
function clearTeacherForm() {
  ['editTeacherId', 'tId', 'tfirstName', 'tlastName', 'tfatherName', 'tSubject', 'tPhone', 'tEmail', 'tQual', 'tExp', 'tAddress', 'tNotes', 'tSalary'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('tStatus').value = 'Active';
  document.getElementById('tGender').value = 'Male';
  document.getElementById('tJoin').value = new Date().toISOString().split('T')[0];
  document.getElementById('teacherModalTitle').textContent = 'Add New Teacher';
}

function saveTeacher() {
  const teacherForm = document.getElementById("addTeacher");
  if (!teacherForm || teacherForm.dataset.teacherListenerAttached) return;
  teacherForm.dataset.teacherListenerAttached = 'true';

  teacherForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const tecId = document.getElementById('editTeacherId').value;
    const formData = new FormData(this);

    if (tecId) {
      const response = await fetch(`http://localhost:5000/api/teachers/${tecId}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        this.reset();
        closeModal("modalTeacher");
        showToast('Teacher updated!');
        renderTeachers();
      } else {
        alert("Error Updating Teacher");
        this.reset();
      }
    } else {
      const res = await fetch(`http://localhost:5000/api/teachers`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        this.reset();
        renderTeachers();
        closeModal('modalTeacher');
        showToast('Teacher added!');
      } else {
        alert("Error creating Teacher");
      }
    }
  });
}

async function editTeacher(id) {
  const apiUrl = `http://localhost:5000/api/teachers/${id}`;
  const res = await fetch(apiUrl);
  const teacher = await res.json();
  // const t = db.teachers.find(x => x.id == id); if (!t) return;
  document.getElementById('editTeacherId').value = teacher._id;
  document.getElementById('tId').value = teacher.Id || '';
  document.getElementById('tfirstName').value = teacher.firstName; document.getElementById('tlastName').value = teacher.lastName;
  document.getElementById('tfatherName').value = teacher.fatherName; document.getElementById('tSubject').value = teacher.subject;
  document.getElementById('tPhone').value = teacher.phone || ''; document.getElementById('tEmail').value = teacher.email || '';
  document.getElementById('tQual').value = teacher.qualification || ''; document.getElementById('tExp').value = teacher.experience || '';
  document.getElementById('tJoin').value = teacher.joinDate ? teacher.joinDate.split('T')[0] : '';
  document.getElementById('tStatus').value = teacher.status || 'Active';
  document.getElementById('tSalary').value = teacher.salary || ''; document.getElementById('tGender').value = teacher.gender || 'Male';
  document.getElementById('tAddress').value = teacher.address || ''; document.getElementById('tNotes').value = teacher.notes || '';
  document.getElementById('teacherModalTitle').textContent = 'Edit Teacher';
  openModal('modalTeacher');
}

async function deleteTeacher(id) {
  if (confirm("Are you sure to delete this record?")) {
    await fetch(`http://localhost:5000/api/teachers/${id}`, { method: 'DELETE' })
    renderTeachers(); showToast('Teacher deleted.', '#DC2626');
  }
}





async function viewTeacher(id) {
  const apiUrl = `http://localhost:5000/api/teachers/${id}`;
  const res = await fetch(apiUrl);
  const teacher = await res.json();


  document.getElementById('TeacherDetailBody').innerHTML = `
    <div class="profileHeader">
      <div class="profileAvatar" >${initials(teacher.firstName)}</div>
      <div>
        <div class="profileName">${teacher.firstName} ${teacher.lastName || '__'}</div>
        <div class="profileSub">ID:${teacher.Id} &nbsp;|&nbsp; ${teacher.phone}</div>
        <div style="margin-top:8px"><span class="badge ${teacher.status === 'Active' ? 'badge-green' : 'badge-red'}">${teacher.status}</span></div>
      </div>
    </div>
    <div class="infoGrid" style="margin-bottom:20px">
      <div class="infoItem"><div class="ilabel">Father's Name</div><div class="ivalue">${teacher.fatherName || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Date of Join</div><div class="ivalue">${teacher.joinDate || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Gender</div><div class="ivalue">${teacher.gender || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Email</div><div class="ivalue">${teacher.email || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Subject</div><div class="ivalue">${teacher.subject || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Experience</div><div class="ivalue">${teacher.experience || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Qualification</div><div class="ivalue">${teacher.qualification || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Salary</div><div class="ivalue">${teacher.salary || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Address</div><div class="ivalue">${teacher.address || '—'}</div></div>
      <div class="infoItem"><div class="ilabel">Notes</div><div class="ivalue">${teacher.notes || '—'}</div></div>
    </div>`;
  openModal('modalViewTeacher');

}






async function renderTeachers() {
  const apiUrl = "http://localhost:5000/api/teachers";
  const res = await fetch(apiUrl);
  const teachers = await res.json();

  const tbody = document.getElementById('teacherTBody');
  tbody.innerHTML = ""
  if (teachers.length <= 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="emptyState"><div class="emptyIcon">👨‍🏫</div><p>No teachers yet.</p></div></td></tr>'; return;
  } else {
    tbody.innerHTML = teachers.map(teacher => {
      const bg = avatarColor(teacher.firstName);
      return `<tr>
      <td><div class="nameCell"><div class="avatar" style="background:${bg}">${initials(teacher.firstName)}</div>${teacher.firstName} ${teacher.lastName}</div></td>
      <td>${teacher.Id}</td><td>${teacher.subject}</td><td>${teacher.phone || '—'}</td>
      <td><span class="badge ${teacher.status === 'Active' ? 'badge-green' : teacher.status === 'On Leave' ? 'badge-gold' : 'badge-gray'}">${teacher.status}</span></td>
      <td>${teacher.salary ? 'AFG ' + (+teacher.salary).toLocaleString() : '—'}</td>
      <td>
      <div class="btnGroup">
      <button class="btn btn-outline btn-sm" onclick="viewTeacher('${teacher._id}')">👁</button>
      <button class="btn btn-gold btn-sm" onclick="editTeacher('${teacher._id}')">✏️</button>
      <button class="btn btn-red btn-sm" onclick="deleteTeacher('${teacher._id}')">🗑️</button>
      </div>
      </td>
      </tr>`;
    }).join('');
  }
}










/* ══════════════════════════════════════
   COURSES
══════════════════════════════════════ */
function clearCourseForm() {
  ['editCourseId', 'cName', 'cCode', 'cDuration', 'cFee', 'cMax', 'cSchedule', 'cDesc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('cStatus').value = 'Active';
  document.getElementById('cTeacher').value = '';
  document.getElementById('courseModalTitle').textContent = 'Add New Course';
}

async function fetchCourses() {
  try {
    const res = await fetch('http://localhost:5000/api/courses');
    if (!res.ok) throw new Error('Failed to fetch courses');
    const arr = await res.json();
    db.courses = arr.map(c => ({ id: c._id, name: c.name, code: c.code, teacher: c.teacher, duration: c.duration, start: c.start, end: c.end, fee: c.fee, max: c.max, status: c.status, schedule: c.schedule, desc: c.desc }));
  } catch (err) {
    console.error('fetchCourses error', err);
    db.courses = [];
  }
}
async function fetchTeachers() {
  try {
    const res = await fetch('/api/teachers');
    if (!res.ok) throw new Error('Failed to fetch teachers');
    const arr = await res.json();
    db.teachers = arr.map(t => ({ id: t._id, name: `${t.firstName || ''}${t.lastName ? ' ' + t.lastName : ''}`.trim() || t.Id || 'Teacher', subject: t.subject, phone: t.phone, status: t.status || 'Active' }));
  } catch (err) {
    console.error('fetchTeachers error', err);
    db.teachers = [];
  }
}

async function fetchStudents() {
  try {
    const res = await fetch('http://localhost:5000/api/students');
    if (!res.ok) throw new Error('Failed to fetch students');
    const arr = await res.json();
    db.students = arr.map(s => {
      const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
      return { _id: s._id, id: s._id, name: name || s.Id || 'Student', firstName: s.firstName, lastName: s.lastName, Id: s.Id, fatherName: s.fatherName, phone: s.phone, email: s.email, course: s.course, admDate: s.admDate, status: s.status, fee: s.fee, address: s.address, notes: s.notes };
    });
  } catch (err) {
    console.error('fetchStudents error', err);
    db.students = [];
  }
}
async function fetchNotices() {
  try {
    const res = await fetch('http://localhost:5000/api/notices');
    if (!res.ok) throw new Error('Failed to fetch notices');
    const arr = await res.json();
    db.notices = arr.map(n => ({ id: n._id, title: n.title, cat: n.cat, date: n.date, msg: n.msg, createdAt: n.createdAt }));
  } catch (err) {
    console.error('fetchNotices error', err);
    db.notices = [];
  }
}

async function fetchFees() {
  try {
    const res = await fetch('http://localhost:5000/api/fees');
    if (!res.ok) throw new Error('Failed to fetch fees');
    const arr = await res.json();
    db.fees = arr.map(f => ({ id: f._id, studentId: f.studentId, studentName: f.studentName, course: f.course, amount: f.amount, date: f.date, method: f.method, status: f.status, notes: f.notes }));
  } catch (err) { console.error('fetchFees error', err); db.fees = []; }
}

async function fetchSalaries() {
  try {
    const res = await fetch('http://localhost:5000/api/salaries');
    if (!res.ok) throw new Error('Failed to fetch salaries');
    const arr = await res.json();
    db.salaries = arr.map(s => ({ id: s._id, teacherId: s.teacherId, teacherName: s.teacherName, month: s.month, amount: s.amount, bonus: s.bonus, deduct: s.deduct, net: s.net, status: s.status, notes: s.notes }));
  } catch (err) { console.error('fetchSalaries error', err); db.salaries = []; }
}

function clearNoticeForm() {
  ['editNoticeId', 'notTitle', 'notCat', 'notDate', 'notMsg'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('noticeModalTitle').textContent = 'Add New Notice';
}

function saveNotice() {
  const form = document.getElementById('AddNotice');
  if (!form || form.dataset.listenerAttached) return;
  form.dataset.listenerAttached = 'true';
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const eid = document.getElementById('editNoticeId').value;
    const payload = {
      title: document.getElementById('notTitle').value.trim(),
      cat: document.getElementById('notCat').value.trim(),
      date: document.getElementById('notDate').value,
      msg: document.getElementById('notMsg').value.trim()
    };
    try {
      if (eid) {
        const res = await fetch(`http://localhost:5000/api/notices/${eid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Update failed');
        showToast('Notice updated!');
      } else {
        const res = await fetch('http://localhost:5000/api/notices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Create failed');
        showToast('Notice added!');
      }
      closeModal('modalNotice'); clearNoticeForm();
      await fetchNotices(); renderNotices();
      this.reset();
    } catch (err) {
      showToast('Error saving notice', '#DC2626');
    }
  });
}

async function editNotice(id) {
  try {
    const res = await fetch(`http://localhost:5000/api/notices/${id}`);
    if (!res.ok) throw new Error('Fetch failed');
    const n = await res.json();
    document.getElementById('editNoticeId').value = n._id;
    document.getElementById('notTitle').value = n.title || '';
    document.getElementById('notCat').value = n.cat || '';
    document.getElementById('notDate').value = n.date || '';
    document.getElementById('notMsg').value = n.msg || '';
    document.getElementById('noticeModalTitle').textContent = 'Edit Notice';
    openModal('modalNotice');
  } catch (err) {
    showToast('Error loading notice', '#DC2626');
  }
}

async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  try {
    const res = await fetch(`http://localhost:5000/api/notices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    await fetchNotices(); renderNotices();
    showToast('Notice deleted.', '#DC2626');
  } catch (err) { showToast('Error deleting notice', '#DC2626'); }
}

function renderNotices() {
  const el = document.getElementById('noticeList');
  if (!el) return;
  if (!db.notices.length) { el.innerHTML = '<div class="emptyState"><div class="emptyIcon">📢</div><p>No notices yet.</p></div>'; return; }
  el.innerHTML = db.notices.map(n => `
    <div class="noticeCard">
      <div class="noticeHeader">
        <div>
          <strong>${n.title}</strong>
          <div class="noticeMeta">${n.cat || ''} • ${n.date || ''}</div>
        </div>
        <div class="btnGroup">
          <button class="btn btn-outline btn-sm" onclick="editNotice('${n.id}')">✏️</button>
          <button class="btn btn-red btn-sm" onclick="deleteNotice('${n.id}')">🗑️</button>
        </div>
      </div>
      <div class="noticeBody">${n.msg}</div>
    </div>`).join('');
    applyPermissions();
  }
async function saveCourse() {
  const name = document.getElementById('cName').value.trim();
  const code = document.getElementById('cCode').value.trim();
  if (!name || !code) { showToast('Course name and code are required!', '#DC2626'); return; }
  const eid = document.getElementById('editCourseId').value;
  const payload = {
    name, code,
    teacher: document.getElementById('cTeacher').value,
    duration: document.getElementById('cDuration').value,
    start: document.getElementById('cStart').value,
    end: document.getElementById('cEnd').value,
    fee: document.getElementById('cFee').value,
    max: document.getElementById('cMax').value,
    status: document.getElementById('cStatus').value,
    schedule: document.getElementById('cSchedule').value,
    desc: document.getElementById('cDesc').value
  };

  try {
    if (eid) {
      const res = await fetch(`http://localhost:5000/api/courses/${eid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Update failed');
      showToast('Course updated!');
    } else {
      const res = await fetch('http://localhost:5000/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Create failed');
      showToast('Course added!');
    }
    closeModal('modalCourse'); clearCourseForm();
    await fetchCourses(); renderAll();
  } catch (err) {
    showToast('Error saving course', '#DC2626');
  }
}

function editCourse(id) {
  const c = db.courses.find(x => x.id == id); if (!c) return;
  document.getElementById('editCourseId').value = c.id;
  document.getElementById('cName').value = c.name; document.getElementById('cCode').value = c.code;
  document.getElementById('cTeacher').value = c.teacher || ''; document.getElementById('cDuration').value = c.duration || '';
  document.getElementById('cStart').value = c.start || ''; document.getElementById('cEnd').value = c.end || '';
  document.getElementById('cFee').value = c.fee || ''; document.getElementById('cMax').value = c.max || '';
  document.getElementById('cStatus').value = c.status || 'Active'; document.getElementById('cSchedule').value = c.schedule || '';
  document.getElementById('cDesc').value = c.desc || '';
  document.getElementById('courseModalTitle').textContent = 'Edit Course';
  openModal('modalCourse');
}

async function deleteCourse(id) { confirmDelete(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      db.courses = db.courses.filter(x => x.id != id);
      showToast('Course deleted.', '#DC2626');
      renderAll();
    } catch (err) {
      showToast('Error deleting course', '#DC2626');
    }
  }); }

async function renderCourses() {
  const tbody = document.getElementById('courseTBody');
  if (!db.courses.length) { tbody.innerHTML = '<tr><td colspan="8"><div class="emptyState"><div class="emptyIcon">📚</div><p>No courses yet.</p></div></td></tr>'; return; }
  tbody.innerHTML = db.courses.map(c => {
    const teacher = db.teachers.find(t => t.id == c.teacher);
    const enrolled = db.students.filter(s => s.course == c.id).length;
    return `<tr>
      <td><strong>${c.name}</strong>${c.schedule ? `<div style="font-size:11px;color:var(--muted)">${c.schedule}</div>` : ''}</td>
      <td><code style="background:var(--bg);padding:2px 6px;border-radius:4px;font-size:12px">${c.code}</code></td>
      <td>${teacher ? teacher.name : '—'}</td>
      <td>${enrolled}${c.max ? '/' + c.max : ''}</td>
      <td>${c.duration || '—'}</td>
      <td>${c.fee ? 'PKR ' + (+c.fee).toLocaleString() : '—'}</td>
      <td><span class="badge ${c.status === 'Active' ? 'badge-green' : c.status === 'Upcoming' ? 'badge-blue' : 'badge-gray'}">${c.status}</span></td>
      <td>
        <div class="btnGroup">
          <button class="btn btn-gold btn-sm" onclick="editCourse('${c.id}')">✏️</button>
          <button class="btn btn-red btn-sm" onclick="deleteCourse('${c.id}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  applyPermissions();
}








/* ══════════════════════════════════════
   ATTENDANCE - STUDENTS
══════════════════════════════════════ */
let currentStudentAtt = {};

function refreshAttendanceDropdowns() {
  const sel = document.getElementById('attStudCourse');
  sel.innerHTML = '<option value="all">All Students</option>' + db.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const selT = document.getElementById('attTeachSubject');
  selT.innerHTML = '<option value="all">All Teachers</option>' + [...new Set(db.teachers.map(t => t.subject))].map(s => `<option value="${s}">${s}</option>`).join('');
}

async function loadStudentAttendance() {
  const date = document.getElementById('attStudDate').value;
  const courseId = document.getElementById('attStudCourse').value;
  let students = db.students.filter(s => s.status === 'Active');
  if (courseId !== 'all') students = students.filter(s => s.course == courseId);
  currentStudentAtt = {};
  if (date) {
    try {
      const res = await fetch(`/api/attendance/students?date=${encodeURIComponent(date)}`);
      if (res.ok) {
        const rec = await res.json();
        currentStudentAtt = rec?.records || {};
        // cache locally for reporting
        db.studentAttendance[date] = Object.assign({}, currentStudentAtt);
      }
    } catch (err) { console.error('loadStudentAttendance error', err); }
  }
  const grid = document.getElementById('attStudGrid');
  if (!students.length) { grid.innerHTML = '<div class="emptyState"><div class="emptyIcon">👥</div><p>No students found.</p></div>'; return; }
  grid.innerHTML = students.map(s => {
    const st = currentStudentAtt[s.Id] || 'none';
    const bg = avatarColor(s.name);
    return `<div class="attendeeCard ${st}" id="attcard-${s.Id}" onclick="cycleAttendance('${s.Id}', 'student')">
      <div class="avatar" style="background:${bg};margin-right:0">${initials(s.name)}</div>
      <div class="attendeeInfo">
        <div class="name">${s.name}</div>
        <div class="id">STU-${s.Id}</div>
      </div>
      <div class="attStatus" id="atts-${s.Id}">${st === 'present' ? '✅' : st === 'absent' ? '❌' : st === 'late' ? '🕐' : '⬜'}</div>
    </div>`;
  }).join('');
  updateAttSummary();
}

function cycleAttendance(id, type) {
  const states = ['none', 'present', 'absent', 'late'];
  const cur = currentStudentAtt[id] || 'none';
  const next = states[(states.indexOf(cur) + 1) % states.length];
  currentStudentAtt[id] = next;
  const card = document.getElementById('attcard-' + id);
  card.className = 'attendeeCard ' + (next === 'none' ? '' : next);
  document.getElementById('atts-' + id).textContent = next === 'present' ? '✅' : next === 'absent' ? '❌' : next === 'late' ? '🕐' : '⬜';
  updateAttSummary();
}

function markAllPresent() { Object.keys(currentStudentAtt).forEach(k => { }); document.querySelectorAll('[id^="attcard-"]').forEach(card => { const id = card.id.split('-')[1]; currentStudentAtt[id] = 'present'; card.className = 'attendeeCard present'; document.getElementById('atts-' + id).textContent = '✅'; }); updateAttSummary(); }
function markAllAbsent() { document.querySelectorAll('[id^="attcard-"]').forEach(card => { const id = card.id.split('-')[1]; currentStudentAtt[id] = 'absent'; card.className = 'attendeeCard absent'; document.getElementById('atts-' + id).textContent = '❌'; }); updateAttSummary(); }

function updateAttSummary() {
  const vals = Object.values(currentStudentAtt);
  document.getElementById('attSummary').textContent = `✅ Present: ${vals.filter(v => v === 'present').length}  ❌ Absent: ${vals.filter(v => v === 'absent').length}  🕐 Late: ${vals.filter(v => v === 'late').length}`;
}

function updateTeacherAttSummary() {
  const vals = Object.values(currentTeacherAtt);
  const el = document.getElementById('attTeachSummary');
  if (!el) return;
  el.textContent = `✅ Present: ${vals.filter(v => v === 'present').length}  ❌ Absent: ${vals.filter(v => v === 'absent').length}  🕐 Late: ${vals.filter(v => v === 'late').length}`;
}

function saveAttendance() {
  const date = document.getElementById('attStudDate').value;
  if (!date) { showToast('Please select a date!', '#DC2626'); return; }
  (async () => {
    try {
      const res = await fetch('/api/attendance/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, records: currentStudentAtt }) });
      if (!res.ok) throw new Error('Save failed');
      // update local cache so reports reflect saved data immediately
      db.studentAttendance[date] = Object.assign({}, currentStudentAtt);
      showToast('✅ Student attendance saved for ' + date);
    } catch (err) { showToast('Error saving attendance', '#DC2626'); }
  })();
}




/* ══════════════════════════════════════
   ATTENDANCE - TEACHERS
══════════════════════════════════════ */
let currentTeacherAtt = {};

async function loadTeacherAttendance() {
  const date = document.getElementById('attTeachDate').value;
  const subject = document.getElementById('attTeachSubject').value;
  let teachers = db.teachers.filter(t => t.status === 'Active');
  if (subject !== 'all') teachers = teachers.filter(t => t.subject === subject);
  currentTeacherAtt = {};
  if (date) {
    try {
      const res = await fetch(`/api/attendance/teachers?date=${encodeURIComponent(date)}`);
      if (res.ok) {
        const rec = await res.json();
        currentTeacherAtt = rec?.records || {};
      }
    } catch (err) { console.error('loadTeacherAttendance error', err); }
  }
  const grid = document.getElementById('attTeachGrid');
  if (!teachers.length) { grid.innerHTML = '<div class="emptyState"><div class="emptyIcon">👥</div><p>No teachers found.</p></div>'; return; }
  grid.innerHTML = teachers.map(t => {
    const st = currentTeacherAtt[t.id] || 'none';
    const bg = avatarColor(t.name);
    return `<div class="attendeeCard ${st}" id="tattcard-${t.id}" onclick="cycleTeacherAttendance('${t.id}')">
      <div class="avatar" style="background:${bg};margin-right:0">${initials(t.name)}</div>
      <div class="attendeeInfo">
        <div class="name">${t.name}</div>
        <div class="id">${t.subject}</div>
      </div>
      <div class="attStatus" id="tatts-${t.id}">${st === 'present' ? '✅' : st === 'absent' ? '❌' : st === 'late' ? '🕐' : '⬜'}</div>
    </div>`;
  }).join('');
  updateTeacherAttSummary();
  applyPermissions();
}

function cycleTeacherAttendance(id) {
  const states = ['none', 'present', 'absent', 'late'];
  const cur = currentTeacherAtt[id] || 'none';
  const next = states[(states.indexOf(cur) + 1) % states.length];
  currentTeacherAtt[id] = next;
  const card = document.getElementById('tattcard-' + id);
  card.className = 'attendeeCard ' + (next === 'none' ? '' : next);
  document.getElementById('tatts-' + id).textContent = next === 'present' ? '✅' : next === 'absent' ? '❌' : next === 'late' ? '🕐' : '⬜';
  updateTeacherAttSummary();
}

function markAllTeacherPresent() { document.querySelectorAll('[id^="tattcard-"]').forEach(card => { const id = card.id.split('-')[1]; currentTeacherAtt[id] = 'present'; card.className = 'attendeeCard present'; document.getElementById('tatts-' + id).textContent = '✅'; }); updateTeacherAttSummary(); }
function markAllTeacherAbsent() { document.querySelectorAll('[id^="tattcard-"]').forEach(card => { const id = card.id.split('-')[1]; currentTeacherAtt[id] = 'absent'; card.className = 'attendeeCard absent'; document.getElementById('tatts-' + id).textContent = '❌'; }); updateTeacherAttSummary(); }

function saveTeacherAttendance() {
  const date = document.getElementById('attTeachDate').value;
  if (!date) { showToast('Please select a date!', '#DC2626'); return; }
  (async () => {
    try {
      const res = await fetch('/api/attendance/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, records: currentTeacherAtt }) });
      if (!res.ok) throw new Error('Save failed');
      showToast('✅ Teacher attendance saved for ' + date);
    } catch (err) { showToast('Error saving attendance', '#DC2626'); }
  })();
}






/* ══════════════════════════════════════
   ATTENDANCE REPORT
══════════════════════════════════════ */
async function generateReport() {
  const from = document.getElementById('repFrom').value;
  const to = document.getElementById('repTo').value;
  if (!from || !to) { showToast('Please select a valid from/to date for the report', '#DC2626'); return; }
  let dates = Object.keys(db.studentAttendance).filter(d => d >= from && d <= to).sort();
  // If local cache has no entries for the range, try fetching from server
  if (!dates.length) {
    try {
      const res = await fetch('/api/attendance/students');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          list.forEach(rec => { if (rec && rec.date) db.studentAttendance[rec.date] = rec.records || {}; });
        } else if (list && list.date) {
          db.studentAttendance[list.date] = list.records || {};
        }
        dates = Object.keys(db.studentAttendance).filter(d => d >= from && d <= to).sort();
      }
    } catch (err) { console.error('generateReport fetch error', err); }
  }
  const out = document.getElementById('reportOutput');
  if (!dates.length) { out.innerHTML = '<div class="emptyState"><div class="emptyIcon">📈</div><p>No attendance data found for this period.</p></div>'; return; }
  const rows = db.students.map(s => {
    let present = 0, absent = 0, late = 0;
    dates.forEach(d => { const r = db.studentAttendance[d]?.[s.id]; if (r === 'present') present++; else if (r === 'absent') absent++; else if (r === 'late') late++; });
    const total = present + absent + late;
    const pct = total ? Math.round(present / total * 100) : 0;
    return { s, present, absent, late, total, pct };
  });
  out.innerHTML = `
    <div class="card">
      <div class="cardHeader">
        <span class="cardTitle">Attendance Report: ${from} to ${to} (${dates.length} days)</span>
        <button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ Print</button>
      </div>
      <div class="cardBody" style="padding:0">
        <div class="tableWrap">
          <table>
            <thead><tr><th>Student</th><th>Days Tracked</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th></tr></thead>
            <tbody>
              ${rows.map(r => `<tr>
                <td><div class="nameCell"><div class="avatar" style="background:${avatarColor(r.s.name)}">${initials(r.s.name)}</div>${r.s.name}</div></td>
                <td>${r.total}</td>
                <td><span class="badge badge-green">${r.present}</span></td>
                <td><span class="badge badge-red">${r.absent}</span></td>
                <td><span class="badge badge-gold">${r.late}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1;background:var(--border);border-radius:4px;height:8px">
                      <div style="width:${r.pct}%;background:${r.pct >= 75 ? 'var(--emerald)' : r.pct >= 50 ? 'var(--gold)' : 'var(--red)'};height:8px;border-radius:4px"></div>
                    </div>
                    <span style="font-weight:600;font-size:12px;min-width:32px">${r.pct}%</span>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}







/* ══════════════════════════════════════
   FEES
══════════════════════════════════════ */
function saveFee() {
  const studentId = document.getElementById('feeStudent').value;
  const amount = document.getElementById('feeAmount').value;
  const date = document.getElementById('feeDate').value;
  if (!studentId || !amount || !date) { showToast('Please fill all required fields!', '#DC2626'); return; }
  const student = db.students.find(s => s.id == studentId) || {};
  const payload = {
    studentId: student._id || studentId,
    studentName: student.firstName ? (student.firstName + (student.lastName ? ' ' + student.lastName : '')) : (student.name || ''),
    course: student.course || '',
    amount: +amount,
    date,
    method: document.getElementById('feeMethod').value,
    status: document.getElementById('feeStatus').value,
    notes: document.getElementById('feeNotes').value
  };
  (async () => {
    try {
      const res = await fetch('http://localhost:5000/api/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Save failed');
      await fetchFees(); renderFees(); updateDashboard(); closeModal('modalFee'); showToast('Fee payment recorded!');
    } catch (err) { showToast('Error saving fee', '#DC2626'); }
  })();
}

async function deleteFee(id) { if (!confirm('Delete this fee record?')) return; try { const res = await fetch(`http://localhost:5000/api/fees/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Delete failed'); await fetchFees(); renderFees(); updateDashboard(); showToast('Fee record deleted.', '#DC2626'); } catch (err) { showToast('Error deleting fee', '#DC2626'); } }

function renderFees() {
  const tbody = document.getElementById('feeTBody');
  if (!db.fees.length) { tbody.innerHTML = '<tr><td colspan="7"><div class="emptyState"><div class="emptyIcon">💰</div><p>No fee records yet.</p></div></td></tr>'; return; }
  tbody.innerHTML = db.fees.map(f => {
    const course = db.courses.find(c => c.id == f.course);
    return `<tr>
      <td>${f.studentName}</td><td>${course ? course.name : '—'}</td>
      <td><strong>PKR ${(+f.amount).toLocaleString()}</strong></td><td>${f.date}</td>
      <td>${f.method}</td>
      <td><span class="badge ${f.status === 'Paid' ? 'badge-green' : f.status === 'Partial' ? 'badge-gold' : 'badge-red'}">${f.status}</span></td>
      <td><button class="btn btn-red btn-sm" onclick="deleteFee('${f.id}')">🗑️</button></td>
    </tr>`;
  }).join('');
}







/* ══════════════════════════════════════
   SALARY
══════════════════════════════════════ */
function saveSalary() {
  const teacherId = document.getElementById('salTeacher').value;
  const month = document.getElementById('salMonth').value;
  const amount = document.getElementById('salAmount').value;
  if (!teacherId || !month || !amount) { showToast('Please fill all required fields!', '#DC2626'); return; }
  const teacher = db.teachers.find(t => t.id == teacherId) || {};
  const bonus = +document.getElementById('salBonus').value || 0;
  const deduct = +document.getElementById('salDeduct').value || 0;
  const payload = {
    teacherId: teacher._id || teacherId,
    teacherName: teacher.name || '',
    month,
    amount: +amount,
    bonus,
    deduct,
    status: document.getElementById('salStatus').value,
    notes: document.getElementById('salNotes').value
  };
  (async () => {
    try {
      const res = await fetch('http://localhost:5000/api/salaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Save failed');
      await fetchSalaries(); renderSalaries(); closeModal('modalSalary'); showToast('Salary payment recorded!');
    } catch (err) { showToast('Error saving salary', '#DC2626'); }
  })();
}

async function deleteSalary(id) { if (!confirm('Delete this salary record?')) return; try { const res = await fetch(`http://localhost:5000/api/salaries/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Delete failed'); await fetchSalaries(); renderSalaries(); showToast('Salary record deleted.', '#DC2626'); } catch (err) { showToast('Error deleting salary', '#DC2626'); } }

function renderSalaries() {
  const tbody = document.getElementById('salaryTBody');
  if (!db.salaries.length) { tbody.innerHTML = '<tr><td colspan="8"><div class="emptyState"><div class="emptyIcon">💳</div><p>No salary records yet.</p></div></td></tr>'; return; }
  tbody.innerHTML = db.salaries.map(s => `<tr>
    <td>${s.teacherName}</td><td>${s.month}</td>
    <td>AFG ${s.amount.toLocaleString()}</td><td>PKR ${s.bonus.toLocaleString()}</td>
    <td>AFG ${s.deduct.toLocaleString()}</td><td><strong style="color:var(--emerald)">PKR ${s.net.toLocaleString()}</strong></td>
    <td><span class="badge ${s.status === 'Paid' ? 'badge-green' : 'badge-red'}">${s.status}</span></td>
    <td><button class="btn btn-red btn-sm" onclick="deleteSalary('${s.id}')">🗑️</button></td>
  </tr>`).join('');
  applyPermissions();
}







/* Notices are handled via server-backed functions: fetchNotices/saveNotice/renderNotices */






/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */
function updateDashboard() {
  document.getElementById('dashStudents').textContent = db.students.length;
  document.getElementById('dashTeachers').textContent = db.teachers.length;
  document.getElementById('dashCourses').textContent = db.courses.length;
  const pendingFees = db.students.filter(s => !db.fees.some(f => f.studentId === s.id && f.status === 'Paid')).length;
  document.getElementById('dashFees').textContent = pendingFees;

  const list = document.getElementById('recentStudents');
  const recent = [...db.students].reverse().slice(0, 5);
  list.innerHTML = recent.length ? recent.map(s => {
    const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.Id || 'Student';
    const bg = avatarColor(name);
    const course = db.courses.find(c => c.id == s.course);
    return `<li>
      <div class="avatar" style="background:${bg};margin-right:0">${initials(name)}</div>
      <div class="rInfo"><div class="rName">${name}</div><div class="rSub">${course ? course.name : 'No course'}</div></div>
      <span class="badge badge-green">New</span>
    </li>`;
  }).join('') : '<li style="padding:20px;text-align:center;color:var(--muted);font-size:13px">No students enrolled yet.</li>';

  const notices = document.getElementById('recentNotices');
  const rec = db.notices.slice(0, 4);
  notices.innerHTML = rec.length ? rec.map(n => `<li>
    <div style="font-size:20px">📢</div>
    <div class="rInfo"><div class="rName">${n.title}</div><div class="rSub">${n.cat}</div></div>
    <span class="rTime">${n.date}</span>
  </li>`).join('') : '<li style="padding:20px;text-align:center;color:var(--muted);font-size:13px">No notices posted yet.</li>';

  // Chart
  // Dynamic monthly attendance overview based on db.studentAttendance
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chart = document.getElementById('attendanceChart');
  // Aggregate present counts per month
  const monthStats = Array.from({ length: 12 }, () => ({ present: 0, total: 0 }));
  Object.keys(db.studentAttendance).forEach(date => {
    const rec = db.studentAttendance[date] || {};
    const m = new Date(date).getMonth();
    Object.values(rec).forEach(v => {
      if (v === 'present') monthStats[m].present++;
      if (v === 'present' || v === 'absent' || v === 'late') monthStats[m].total++;
    });
  });
  // Render bars using percentage present (or low opacity if no data)
  chart.innerHTML = `<div style="display:flex;align-items:flex-end;gap:8px;height:140px;padding:0 4px">
    ${months.map((m, i) => {
      const stat = monthStats[i];
      const pct = stat.total ? Math.round(stat.present / stat.total * 100) : 0;
      const h = 20 + Math.floor(pct * 1.1);
      const color = pct >= 75 ? 'var(--emerald)' : pct >= 50 ? 'var(--gold)' : pct > 0 ? 'var(--red)' : 'rgba(0,0,0,0.06)';
      const opacity = stat.total ? 1 : 0.25;
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center">
        <div style="flex:1;width:100%;display:flex;align-items:flex-end">
          <div style="width:100%;height:${h}px;background:${color};border-radius:4px 4px 0 0;opacity:${opacity}"></div>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">${m}</div>
      </div>`;
    }).join('')}
  </div><p style="font-size:11px;color:var(--muted);margin-top:6px;text-align:right">Monthly present % (darker = more data)</p>`;
}

async function updateNavBadges() {
  document.getElementById('navStudentCount').textContent = db.students.length;
  document.getElementById('navTeacherCount').textContent = db.teachers.length;
  document.getElementById('navCourseCount').textContent = db.courses.length;
}

function updateSettingsStats() {
  const el = document.getElementById('settingsStats');
  if (!el) return;
  el.innerHTML = [
    { label: 'Total Students', value: db.students.length },
    { label: 'Active Students', value: db.students.filter(s => s.status === 'Active').length },
    { label: 'Total Teachers', value: db.teachers.length },
    { label: 'Total Courses', value: db.courses.length },
    { label: 'Attendance Records', value: Object.keys(db.studentAttendance).length + ' days' },
    { label: 'Fee Collections', value: 'PKR ' + db.fees.reduce((a, f) => a + (+f.amount || 0), 0).toLocaleString() },
    { label: 'Total Salary Paid', value: 'PKR ' + db.salaries.reduce((a, s) => a + (s.net || 0), 0).toLocaleString() },
    { label: 'Notices Posted', value: db.notices.length }
  ].map(i => `<div class="infoItem"><div class="ilabel">${i.label}</div><div class="ivalue">${i.value}</div></div>`).join('');
}

// Apply role-based UI permissions
function applyPermissions() {
  // If not authenticated, don't change login controls
  const token = getToken();
  if (!token) {
    // ensure login screen buttons remain visible
    document.querySelectorAll('#loginScreen button, #loginScreen .btn').forEach(el => el.style.display = '');
    return;
  }
  const user = getUserInfo();
  const role = (currentRole || user?.role || '').toString();
  // Admin sees everything
  if (role === 'Administrator') {
    document.querySelectorAll('[data-admin-only]').forEach(el => el.style.display = '');
    document.querySelectorAll('[data-hide-for-teacher]').forEach(el => el.style.display = '');
    return;
  }

  // Hide delete actions for non-admins
  document.querySelectorAll('button[onclick]').forEach(btn => {
    const on = btn.getAttribute('onclick') || '';
    if (/delete(Student|Teacher|Course|Fee|Salary|Notice)\(/.test(on)) btn.style.display = 'none';
  });

  // Hide course creation for non-admin
  document.querySelectorAll('[onclick*="openModal(\'modalCourse\')"]').forEach(el => el.style.display = 'none');

  // Hide salary pay for non-admin
  document.querySelectorAll('[onclick*="openModal(\'modalSalary\')"]').forEach(el => el.style.display = 'none');

  // Teacher specific: leave fee and attendance controls visible
  if (role === 'Teacher') {
    document.querySelectorAll('[data-teacher-only]').forEach(el => el.style.display = '');
    return;
  }

  // Student: hide most action buttons except view/showPage
  document.querySelectorAll('button, .btn').forEach(b => {
    const on = b.getAttribute && b.getAttribute('onclick') || '';
    if (!on.includes('view') && !on.includes('showPage')) b.style.display = 'none';
  });
}

// Auto-login if token exists when the page reloads
(async function () {
  const token = getToken();
  const user = getUserInfo();
  if (!token || !user) return;

  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const freshUser = await res.json();
      setToken(token);
      setUserInfo(freshUser);
      await setUIForUser(freshUser);
    } else {
      setToken(null);
      setUserInfo(null);
    }
  } catch (e) {
    setToken(null);
    setUserInfo(null);
  }
})();







/* ══════════════════════════════════════
   DROPDOWNS
══════════════════════════════════════ */
async function refreshDropdowns() {
  // Ensure data loaded from server if cache empty
  const loaders = [];
  if (!db.courses || !db.courses.length) loaders.push(fetchCourses());
  if (!db.teachers || !db.teachers.length) loaders.push(fetchTeachers());
  if (loaders.length) await Promise.all(loaders);

  // Courses in student modal
  const sc = document.getElementById('sCourse');
  if (sc) sc.innerHTML = '<option value="">-- Select Course --</option>' + db.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  // Teachers in course modal
  const ct = document.getElementById('cTeacher');
  if (ct) ct.innerHTML = '<option value="">-- Select Teacher --</option>' + db.teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  // Students in fee modal
  const fs = document.getElementById('feeStudent');
  if (fs) fs.innerHTML = '<option value="">-- Select Student --</option>' + db.students.map(s => `<option value="${s.id}">${s.name} (STU-${s.id})</option>`).join('');
  // Teachers in salary modal
  const st = document.getElementById('salTeacher');
  if (st) st.innerHTML = '<option value="">-- Select Teacher --</option>' + db.teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  // Course filter in students page
  const cf = document.getElementById('courseFilterStudents');
  if (cf) cf.innerHTML = '<option value="">All Courses</option>' + db.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}






/* ══════════════════════════════════════
   SEARCH & FILTER
══════════════════════════════════════ */
function filterTable(tableId, query) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
  });
}

function filterByStatus(tableId, val, col) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (!cells.length) return;
    row.style.display = (!val || (cells[col] && cells[col].textContent.includes(val))) ? '' : 'none';
  });
}







/* ══════════════════════════════════════
   EXPORT CSV
══════════════════════════════════════ */
function exportCSV(type) {
  let rows = [], filename = 'export.csv';
  if (type === 'students') {
    filename = 'students.csv';
    rows = [['ID', 'Name', 'Father', 'Phone', 'Email', 'Course', 'Admission Date', 'Status', 'Fee']];
    db.students.forEach(s => { const c = db.courses.find(x => x.id == s.course); rows.push([`STU-${s.id}`, s.name, s.father || '', s.phone, s.email || '', c ? c.name : (s.course || ''), s.admDate || '', s.status, s.fee || '']); });
  } else if (type === 'teachers') {
    filename = 'teachers.csv';
    rows = [['ID', 'Name', 'Subject', 'Phone', 'Email', 'Qualification', 'Experience', 'Status', 'Salary']];
    db.teachers.forEach(t => rows.push([`TCH-${t.id}`, t.name, t.subject, t.phone || '', t.email || '', t.qual || '', t.exp || '', t.status, t.salary || '']));
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  showToast('CSV exported!');
}






// /* ══════════════════════════════════════
//    SEED DEMO DATA
// ══════════════════════════════════════ */
// function seedDemoData() {
//   if (db.teachers.length > 0) return;
//   // Teachers
//   ['Dr. Hassan Khan|Mathematics|+92-300-1234567|M.Sc. Mathematics|8 years|45000',
//     'Ms. Fatima Bibi|English Literature|+92-301-2345678|M.A. English|5 years|38000',
//     'Mr. Asad Ullah|Computer Science|+92-302-3456789|M.Sc. Computer Science|6 years|42000',
//     'Mrs. Zara Ali|Physics|+92-303-4567890|M.Sc. Physics|4 years|36000'
//   ].forEach(d => {
//     const [name, subject, phone, qual, exp, salary] = d.split('|');
//     db.teachers.push({ id: db.nextTeacherId++, name, subject, phone, qual, exp, salary, status: 'Active', gender: name.startsWith('Ms') || name.startsWith('Mrs') ? 'Female' : 'Male', join: '2023-01-01', email: '', address: '', notes: '' });
//   });
//   // Courses
//   ['Advanced Mathematics|MATH-101|Mon/Wed 9-11 AM|6 months|5000|30',
//     'English Communication|ENG-201|Tue/Thu 11-1 PM|4 months|4000|25',
//     'Computer Basics|CS-301|Daily 2-4 PM|3 months|6000|20',
//     'Physics Fundamentals|PHY-401|Mon/Fri 10-12 PM|5 months|4500|28'
//   ].forEach((d, i) => {
//     const [name, code, schedule, duration, fee, max] = d.split('|');
//     db.courses.push({ id: db.nextCourseId++, name, code, schedule, duration, fee, max, teacher: db.teachers[i]?.id || '', status: 'Active', start: '2024-01-15', end: '2024-07-15', desc: '' });
//   });
//   // Students
//   ['Ahmad Ali|Noor Ali|+92-310-1111111|Male',
//     'Bilal Khan|Tariq Khan|+92-311-2222222|Male',
//     'Fatima Noor|Shah Noor|+92-312-3333333|Female',
//     'Sara Ahmed|Jamil Ahmed|+92-313-4444444|Female',
//     'Usman Ghani|Abdul Ghani|+92-314-5555555|Male',
//     'Zainab Hussain|Hussain Ali|+92-315-6666666|Female'
//   ].forEach((d, i) => {
//     const [name, father, phone, gender] = d.split('|');
//     db.students.push({ id: db.nextStudentId++, name, father, phone, gender, email: '', course: db.courses[i % db.courses.length]?.id || '', admDate: '2024-01-20', status: 'Active', fee: db.courses[i % db.courses.length]?.fee || '5000', address: 'Peshawar', notes: '' });
//   });
//   // Notices
//   db.notices.push({ id: Date.now(), title: 'Welcome to Noor Ali Educational Center!', cat: 'General', date: new Date().toISOString().split('T')[0], msg: 'We are delighted to welcome all students and teachers to the new academic session. May Allah bless your learning journey.' });
//   db.notices.push({ id: Date.now() - 1, title: 'Fee Submission Deadline', cat: 'Fee', date: new Date().toISOString().split('T')[0], msg: 'All students are reminded to submit their fees by the end of this month. Late fee will be charged after the deadline.' });
//   save();
// }





/* ══════════════════════════════════════
   KEYBOARD SHORTCUT
══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') doLogin();
  if (e.key === 'Escape') document.querySelectorAll('.modalOverlay.open').forEach(m => m.classList.remove('open'));
});




/* ══════════════════════════════════════
  BOOT
══════════════════════════════════════ */
initApp();


