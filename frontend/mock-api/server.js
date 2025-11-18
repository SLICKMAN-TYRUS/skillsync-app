const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const fs = require('fs');
const path = require('path');

// Data persistence file
const DATA_FILE = path.join(__dirname, 'data.json');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Load or initialize data
let db = {
  users: [], // { id, role: 'Student'|'Provider'|'Admin', name, email, avatar, phone, bio }
  gigs: [], // { id, title, description, providerId, price, currency, location, createdAt, status }
  applications: [], // { id, gigId, studentId, resumeUrl, status, createdAt }
  notifications: [], // { id, userId, type, message, data, read, createdAt }
  uploads: [], // metadata
  messages: [], // { id, threadId, senderId, text, createdAt }
};

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      db = JSON.parse(raw);
      console.log('Loaded mock data from', DATA_FILE);
    } catch (e) {
      console.error('Failed to load data.json, using defaults', e);
    }
  } else {
    // seed sample data
    seedData();
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to save data.json', e);
  }
}

function uuid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function now() { return new Date().toISOString(); }

function seedData() {
  db.users = [
    { id: 'admin-1', role: 'Admin', name: 'Admin User', email: 'admin@skillsync.test' },
    { id: 'prov-1', role: 'Provider', name: 'Alice Provider', email: 'alice@provider.test', avatar: '', phone: '+250788000001' },
    { id: 'prov-2', role: 'Provider', name: 'Bob Builder', email: 'bob@provider.test', avatar: '', phone: '+250788000002' },
    { id: 'stu-1', role: 'Student', name: 'Charlie Student', email: 'charlie@student.test', avatar: '', phone: '+250788000010' },
    { id: 'stu-2', role: 'Student', name: 'Dana Student', email: 'dana@student.test', avatar: '', phone: '+250788000011' },
  ];

  db.gigs = [
    { id: 'g1', title: 'Math Tutoring (GCSE)', description: 'Help with algebra and calculus', providerId: 'prov-1', price: 15, currency: 'USD', location: 'Kimironko', createdAt: now(), status: 'Published' },
    { id: 'g2', title: 'Logo & Brand Kit', description: 'Design a logo and brand assets', providerId: 'prov-2', price: 80, currency: 'USD', location: 'Kacyiru', createdAt: now(), status: 'Published' },
  ];

  db.applications = [
    { id: 'a1', gigId: 'g1', studentId: 'stu-1', resumeUrl: '', status: 'pending', createdAt: now() },
  ];

  db.notifications = [
    { id: 'n1', userId: 'prov-1', type: 'application', message: 'Charlie applied to Math Tutoring', data: { applicationId: 'a1' }, read: false, createdAt: now() },
    { id: 'n2', userId: 'admin-1', type: 'new_gig', message: 'New gig posted: Math Tutoring', data: { gigId: 'g1' }, read: false, createdAt: now() },
  ];

  db.uploads = [];
  db.messages = [
    { id: 'm1', threadId: 'general', senderId: 'admin-1', text: 'Welcome to SkillSync general chat!', createdAt: now() },
  ];
}

// simple auth middleware - accept x-user-id or Authorization: Bearer <id>
function authMiddleware(req, res, next) {
  const header = req.headers['x-user-id'] || (() => {
    const auth = req.headers['authorization'];
    if (!auth) return null;
    const parts = auth.split(' ');
    return parts.length === 2 ? parts[1] : null;
  })();
  if (!header) {
    req.user = null;
    return next();
  }
  const user = db.users.find(u => u.id === header);
  req.user = user || null;
  next();
}

app.use(authMiddleware);

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes (dashboard entries)
app.get('/api/routes', (req, res) => {
  const routes = {
    Student: [
      { id: 'browse', title: 'Browse Gigs', path: '/student/gigs' },
      { id: 'inbox', title: 'Inbox', path: '/student/inbox' },
      { id: 'profile', title: 'Profile', path: '/student/profile' }
    ],
    Provider: [
      { id: 'manage', title: 'Manage Gigs', path: '/provider/manage' },
      { id: 'post', title: 'Post Gig', path: '/provider/post' },
      { id: 'applications', title: 'Applications', path: '/provider/applications' }
    ],
    Admin: [
      { id: 'users', title: 'User Management', path: '/admin/users' },
      { id: 'approve', title: 'Approve Gigs', path: '/admin/approve' },
      { id: 'logs', title: 'System Logs', path: '/admin/logs' }
    ]
  };
  res.json(routes);
});

// Locations
app.get('/api/locations', (req, res) => {
  const locations = [
    { id: 1, name: 'Kimironko', lat: -1.9330, lng: 30.0829 },
    { id: 2, name: 'Kacyiru', lat: -1.9499, lng: 30.0861 },
    { id: 3, name: 'Remera', lat: -1.9377, lng: 30.0994 },
    { id: 4, name: 'Nyamirambo', lat: -1.9611, lng: 30.0544 },
    { id: 5, name: 'Nyarugenge', lat: -1.9495, lng: 30.0626 },
    { id: 6, name: 'Kicukiro', lat: -1.9780, lng: 30.0893 },
    { id: 7, name: 'Gisozi', lat: -1.9628, lng: 30.0686 },
    { id: 8, name: 'Gikondo', lat: -1.9550, lng: 30.0580 },
    { id: 9, name: 'Kimihurura', lat: -1.9445, lng: 30.0722 },
    { id: 10, name: 'Kibagabaga', lat: -1.9644, lng: 30.0877 },
  ];
  res.json(locations);
});

// USERS
app.get('/api/users', (req, res) => res.json(db.users));
app.get('/api/users/:id', (req, res) => {
  const u = db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  res.json(u);
});

// GIGS
app.get('/api/gigs', (req, res) => {
  // basic filtering: providerId, search
  let list = db.gigs.slice();
  if (req.query.providerId) list = list.filter(g => g.providerId === req.query.providerId);
  if (req.query.q) list = list.filter(g => (g.title + ' ' + g.description).toLowerCase().includes(req.query.q.toLowerCase()));
  res.json(list);
});

app.get('/api/gigs/:id', (req, res) => {
  const g = db.gigs.find(x => x.id === req.params.id);
  if (!g) return res.status(404).json({ message: 'Gig not found' });
  res.json(g);
});

app.post('/api/gigs', (req, res) => {
  const user = req.user;
  if (!user || user.role !== 'Provider') return res.status(403).json({ message: 'Only providers can post gigs' });
  const { title, description, price, currency, location } = req.body;
  if (!title || !description) return res.status(400).json({ message: 'Missing title or description' });
  const gig = { id: uuid('g-'), title, description, providerId: user.id, price: price || 0, currency: currency || 'USD', location: location || 'Online', createdAt: now(), status: 'Published' };
  db.gigs.unshift(gig);
  // notify admins
  db.notifications.unshift({ id: uuid('n-'), userId: 'admin-1', type: 'new_gig', message: `New gig posted: ${gig.title}`, data: { gigId: gig.id }, read: false, createdAt: now() });
  saveData();
  res.status(201).json(gig);
});

app.patch('/api/gigs/:id', (req, res) => {
  const user = req.user;
  const g = db.gigs.find(x => x.id === req.params.id);
  if (!g) return res.status(404).json({ message: 'Gig not found' });
  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) return res.status(403).json({ message: 'Forbidden' });
  Object.assign(g, req.body);
  saveData();
  res.json(g);
});

// Apply to gig
app.post('/api/gigs/:id/apply', (req, res) => {
  const user = req.user;
  if (!user || user.role !== 'Student') return res.status(403).json({ message: 'Only students can apply' });
  const gigId = req.params.id;
  const gig = db.gigs.find(g => g.id === gigId);
  if (!gig) return res.status(404).json({ message: 'Gig not found' });
  const application = { id: uuid('app-'), gigId, studentId: user.id, resumeUrl: req.body.resumeUrl || '', status: 'pending', createdAt: now() };
  db.applications.unshift(application);
  // notify provider
  db.notifications.unshift({ id: uuid('n-'), userId: gig.providerId, type: 'application', message: `${user.name} applied to ${gig.title}`, data: { applicationId: application.id, gigId }, read: false, createdAt: now() });
  // notify admin as well
  db.notifications.unshift({ id: uuid('n-'), userId: 'admin-1', type: 'application', message: `${user.name} applied to ${gig.title}`, data: { applicationId: application.id, gigId }, read: false, createdAt: now() });
  saveData();
  res.status(201).json(application);
});

// APPLICATIONS
app.get('/api/applications', (req, res) => {
  // filter by studentId or providerId
  let list = db.applications.slice();
  if (req.query.studentId) list = list.filter(a => a.studentId === req.query.studentId);
  if (req.query.providerId) {
    const providerGigs = db.gigs.filter(g => g.providerId === req.query.providerId).map(g => g.id);
    list = list.filter(a => providerGigs.includes(a.gigId));
  }
  res.json(list);
});

app.get('/api/applications/:id', (req, res) => {
  const a = db.applications.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ message: 'Application not found' });
  res.json(a);
});

app.patch('/api/applications/:id', (req, res) => {
  const user = req.user;
  const a = db.applications.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ message: 'Application not found' });
  // Only provider who owns the gig or admin can update
  const gig = db.gigs.find(g => g.id === a.gigId);
  if (!user || (user.role !== 'Admin' && gig.providerId !== user.id)) return res.status(403).json({ message: 'Forbidden' });
  Object.assign(a, req.body);
  // notify student
  db.notifications.unshift({ id: uuid('n-'), userId: a.studentId, type: 'application_update', message: `Your application status changed to ${a.status}`, data: { applicationId: a.id }, read: false, createdAt: now() });
  saveData();
  res.json(a);
});

// NOTIFICATIONS
app.get('/api/notifications', (req, res) => {
  const user = req.user;
  if (!user) return res.status(403).json({ message: 'Unauthorized' });
  const list = db.notifications.filter(n => n.userId === user.id);
  res.json(list);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const user = req.user;
  if (!user) return res.status(403).json({ message: 'Unauthorized' });
  const n = db.notifications.find(x => x.id === req.params.id && x.userId === user.id);
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  n.read = true;
  saveData();
  res.json(n);
});

// PROVIDER DASHBOARD
app.get('/api/provider/dashboard', (req, res) => {
  const user = req.user;
  // basic totals
  const openContracts = db.applications.filter(a => a.status === 'accepted' && db.gigs.find(g => g.id === a.gigId && g.providerId === (user && user.id))).length;
  const activeGigs = db.gigs.filter(g => !user || g.providerId === user.id).length;
  const applicants = db.applications.length;
  res.json({ openContracts, activeGigs, applicants });
});

// UPLOADS: signed-url and PUT
app.get('/api/uploads/signed-url', (req, res) => {
  const { filename } = req.query;
  if (!filename) return res.status(400).json({ message: 'filename required' });
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const uploadUrl = `http://localhost:${port}/api/uploads/${encodeURIComponent(safe)}`;
  const fileUrl = `http://localhost:${port}/uploads/${encodeURIComponent(safe)}`;
  res.json({ uploadUrl, fileUrl });
});

app.put('/api/uploads/:filename', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  const filename = req.params.filename;
  if (!filename) return res.status(400).json({ message: 'filename required' });
  const safe = path.basename(filename);
  const dest = path.join(uploadsDir, safe);
  try {
    fs.writeFileSync(dest, req.body);
    const fileUrl = `http://localhost:${port}/uploads/${encodeURIComponent(safe)}`;
    db.uploads.unshift({ id: uuid('up-'), filename: safe, url: fileUrl, createdAt: now() });
    saveData();
    return res.json({ url: fileUrl });
  } catch (err) {
    console.error('Upload save failed', err);
    return res.status(500).json({ message: 'Failed to save upload' });
  }
});

// Admin analytics
app.get('/admin/analytics/overview', (req, res) => {
  res.json({
    total_students: db.users.filter(u => u.role === 'Student').length,
    total_providers: db.users.filter(u => u.role === 'Provider').length,
    total_admins: db.users.filter(u => u.role === 'Admin').length,
    active_gigs_count: db.gigs.length,
    total_applications: db.applications.length,
    completed_gigs_count: db.applications.filter(a => a.status === 'completed').length,
  });
});

app.get('/admin/analytics/users', (req, res) => {
  res.json({ user_growth: [
    { month: 'Jan', count: 50 }, { month: 'Feb', count: 65 }, { month: 'Mar', count: 80 }, { month: 'Apr', count: 90 }, { month: 'May', count: 120 }, { month: 'Jun', count: 150 }
  ]});
});

// small helper to reset mock data (dev only)
app.post('/api/_reset', (req, res) => {
  seedData();
  saveData();
  res.json({ message: 'mock db reset' });
});

loadData();
app.listen(port, () => console.log(`Mock API listening at http://localhost:${port}`));
