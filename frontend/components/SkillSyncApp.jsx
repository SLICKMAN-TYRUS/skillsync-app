import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, MapPin, Briefcase, Home, MessageSquare, Bell, UserCircle, Search, Clock, DollarSign, CheckCircle, Upload, Send, ArrowLeft, Moon, Sun } from 'lucide-react';
import ProviderDashboardWeb from '../screens/web/ProviderDashboardWeb';
import AdminDashboardWeb from '../screens/web/AdminDashboardWeb';

export default function SkillSyncApp() {
  const [currentPage, setCurrentPage] = useState('signup');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState('student');
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your application for "Math Tutoring" was accepted!', time: '2h ago', read: false },
    { id: 2, text: 'New gig posted: Event Photography', time: '5h ago', read: false },
    { id: 3, text: 'Reminder: "Tech Support" gig starts tomorrow', time: '1d ago', read: true }
  ]);
  const [selectedGig, setSelectedGig] = useState(null);
  const [chats, setChats] = useState([
    { id: 1, name: 'Sarah Johnson', lastMessage: 'When can you start the tutoring?', time: '10m ago', unread: 2 },
    { id: 2, name: 'Admin Support', lastMessage: 'Your ID verification is complete', time: '1h ago', unread: 0 },
    { id: 3, name: 'Michael Chen', lastMessage: 'Thanks for your help!', time: '3h ago', unread: 0 }
  ]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [idVerified, setIdVerified] = useState(false);

  const gigs = [
    { id: 1, title: 'Math Tutoring for High School Student', provider: 'Sarah Johnson', location: 'Kimironko', pay: '5,000 RWF/hr', deadline: '2 days', category: 'Tutoring', description: 'Need help with calculus and algebra for my daughter preparing for exams.' },
    { id: 2, title: 'Event Setup Assistant', provider: 'Green Events Ltd', location: 'Kacyiru', pay: '15,000 RWF', deadline: '5 days', category: 'Events', description: 'Help setting up chairs, tables, and decorations for a corporate event.' },
    { id: 3, title: 'Social Media Content Creation', provider: 'Local Café', location: 'Bumbogo', pay: '20,000 RWF', deadline: '1 week', category: 'Marketing', description: 'Create engaging posts and stories for Instagram and Facebook.' },
    { id: 4, title: 'Website Bug Fixes', provider: 'Tech Startup', location: 'Remote', pay: '30,000 RWF', deadline: '3 days', category: 'Tech Support', description: 'Fix responsive design issues on our company website.' }
  ];

  // Load Montserrat and set CSS variables for theme
  useEffect(() => {
    const id = 'skillsync-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    document.documentElement.style.setProperty('--ss-primary', isDark ? '#0F172A' : '#EEF2FF');
    document.documentElement.style.setProperty('--ss-accent', isDark ? '#7C3AED' : '#4F46E5');
    document.documentElement.style.setProperty('--ss-surface', isDark ? '#0B1220' : '#FFFFFF');
    document.documentElement.style.setProperty('--ss-text', isDark ? '#E6EEF8' : '#0F172A');
  }, [isDark]);

  // Responsive spacing: update CSS layout variables based on viewport width
  useEffect(() => {
    const updateSpacing = () => {
      const w = window.innerWidth;
      let pad = 24, gap = 20, maxW = 760;
      if (w < 640) { pad = 16; gap = 14; maxW = Math.max(320, w - 48); }
      else if (w < 1024) { pad = 20; gap = 18; maxW = Math.min(900, w - 120); }
      else { pad = 28; gap = 22; maxW = 760; }
      document.documentElement.style.setProperty('--content-padding', pad + 'px');
      document.documentElement.style.setProperty('--content-gap', gap + 'px');
      document.documentElement.style.setProperty('--content-max-width', maxW + 'px');
    };

    updateSpacing();
    window.addEventListener('resize', updateSpacing);
    return () => window.removeEventListener('resize', updateSpacing);
  }, []);

  const renderSignup = () => (
    <div className="page-wrap prod-typography">
      <div className="single-strand">
        <div className="header-pill">
          <div className="pill-icon">
            <Briefcase size={18} />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">SkillSync</h1>
          <p className="text-gray-600 mt-2">Connect. Earn. Grow.</p>
        </div>

        <div className="content-card">
          <div className="auth-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-muted">Full Name</label>
              <div className="input-with-icon">
                <User className="absolute" size={20} />
                <input type="text" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="label-muted">Email Address</label>
              <div className="input-with-icon">
                <Mail className="absolute" size={20} />
                <input type="email" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="you@alu.edu" />
              </div>
            </div>

            <div>
              <label className="label-muted">Password</label>
              <div className="input-with-icon">
                <Lock className="absolute" size={20} />
                <input type="password" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="label-muted">Confirm Password</label>
              <div className="input-with-icon">
                <Lock className="absolute" size={20} />
                <input type="password" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="label-muted">Skill Category</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 text-gray-400" size={20} />
                <select className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white">
                  <option>Tutoring</option>
                  <option>Tech Support</option>
                  <option>Events</option>
                  <option>Marketing</option>
                  <option>Errands</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-muted">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <select className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white">
                  <option>Kimironko</option>
                  <option>Kacyiru</option>
                  <option>Bumbogo</option>
                  <option>Remera</option>
                  <option>Nyarutarama</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => {
                setIsLoggedIn(true);
                setCurrentPage('home');
              }}
              className="w-full signup-cta"
            >
              Sign Up
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button onClick={() => setCurrentPage('login')} className="login-box">
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="page-wrap prod-typography">
      <div className="single-strand">
        <div className="header-pill">
          <div className="pill-icon">
            <Briefcase size={18} />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">SkillSync</h1>
          <p className="text-gray-600 mt-2">Connect. Earn. Grow.</p>
        </div>

        <div className="content-card">
          <div className="auth-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Log In</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-muted">Email Address</label>
              <div className="input-with-icon">
                <Mail className="absolute" size={20} />
                <input type="email" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="you@alu.edu" />
              </div>
            </div>

            <div>
              <label className="label-muted">Password</label>
              <div className="input-with-icon">
                <Lock className="absolute" size={20} />
                <input type="password" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm text-indigo-600 hover:underline">Forgot password?</a>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => {
                setIsLoggedIn(true);
                setCurrentPage('home');
              }}
              className="w-full signup-cta"
            >
              Log In
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button onClick={() => setCurrentPage('signup')} className="login-box">
                Sign Up
              </button>
            </p>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="content-card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Hi, {userType === 'student' ? 'Student' : userType === 'provider' ? 'Provider' : 'Admin'}!</h1>
          <p className="text-sm text-gray-600">{userType === 'student' ? 'Find your next gig' : userType === 'provider' ? 'Manage your gigs & applications' : 'System overview and moderation'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(d => !d)}
            title="Toggle theme"
            className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-gray-700 flex items-center"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="bg-white p-2 rounded-full">
            <UserCircle size={22} />
          </div>
          <div className="bg-white rounded-full px-3 py-1 text-sm text-gray-700">
            <label className="mr-2">View as</label>
            <select value={userType} onChange={(e) => setUserType(e.target.value)} className="text-sm">
              <option value="student">Student</option>
              <option value="provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-indigo-300" size={20} />
        <input 
          type="text" 
          placeholder="Search gigs..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-50 text-gray-800 placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Tutoring', 'Tech', 'Events', 'Marketing'].map(cat => (
          <button key={cat} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${cat === 'All' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {gigs.map(gig => (
          <div key={gig.id} className="content-card" onClick={() => setSelectedGig(gig)}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg mb-1">{gig.title}</h3>
                <p className="text-gray-600 text-sm">{gig.provider}</p>
              </div>
              <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium">
                {gig.category}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{gig.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{gig.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{gig.deadline}</span>
                </div>
              </div>
              <div className="text-indigo-600 font-bold">{gig.pay}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Use separate web screen components for provider and admin to keep code modular
  const renderProviderHome = () => <ProviderDashboardWeb gigs={gigs} isDark={isDark} setIsDark={setIsDark} />;
  const renderAdminHome = () => <AdminDashboardWeb gigs={gigs} />;

  const renderGigDetail = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-6">
        <button onClick={() => setSelectedGig(null)} className="mb-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">{selectedGig.title}</h1>
      </div>

      <div className="p-6">
        <div className="content-card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{selectedGig.provider}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <CheckCircle size={14} className="text-green-500" />
                <span>Verified Provider</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={18} className="text-gray-400" />
              <span>{selectedGig.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock size={18} className="text-gray-400" />
              <span>Apply by: {selectedGig.deadline}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign size={18} className="text-gray-400" />
              <span className="font-semibold text-indigo-600">{selectedGig.pay}</span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-gray-800 mb-2">Description</h4>
            <p className="text-gray-600 leading-relaxed">{selectedGig.description}</p>
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            Apply for Gig
          </button>
        </div>
      </div>
    </div>
  );

  const renderChats = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
      </div>

      <div className="divide-y">
        {chats.map(chat => (
          <div 
            key={chat.id} 
            className="bg-white p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedChat(chat)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-indigo-600" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-800">{chat.name}</h3>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div className="bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {chat.unread}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatDetail = () => (
    <div className="min-h-screen bg-gray-50 pb-20 flex flex-col">
      <div className="bg-white p-4 border-b flex items-center gap-3">
        <button onClick={() => setSelectedChat(null)}>
          <ArrowLeft size={24} />
        </button>
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <User className="text-indigo-600" size={20} />
        </div>
        <div>
          <h2 className="font-bold text-gray-800">{selectedChat.name}</h2>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex justify-start">
          <div className="bg-white p-3 rounded-2xl rounded-tl-sm max-w-xs shadow-sm">
            <p className="text-gray-800">Hi! I saw your application for the tutoring gig.</p>
            <span className="text-xs text-gray-500 mt-1 block">10:30 AM</span>
          </div>
        </div>
        
        <div className="flex justify-end">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-xs">
            <p>Yes! I'm very interested in helping.</p>
            <span className="text-xs text-indigo-100 mt-1 block">10:32 AM</span>
          </div>
        </div>

        <div className="flex justify-start">
          <div className="bg-white p-3 rounded-2xl rounded-tl-sm max-w-xs shadow-sm">
            <p className="text-gray-800">{selectedChat.lastMessage}</p>
            <span className="text-xs text-gray-500 mt-1 block">10:35 AM</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
      </div>

      <div className="divide-y">
        {notifications.map(notif => (
          <div key={notif.id} className={`p-4 ${notif.read ? 'bg-white' : 'bg-indigo-50'}`}>
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.read ? 'bg-gray-100' : 'bg-indigo-100'}`}>
                <Bell className={notif.read ? 'text-gray-400' : 'text-indigo-600'} size={20} />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                  {notif.text}
                </p>
                <span className="text-xs text-gray-500 mt-1 block">{notif.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const [resumeFile, setResumeFile] = useState(null);

  const handleResumeUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setResumeFile(file.name);
  };

  const renderProfile = () => (
    <div className={`min-h-screen pb-20`} style={{ background: isDark ? '#071025' : '#F3F4F6', fontFamily: 'Montserrat, system-ui, -apple-system' }}>
      <div style={{ background: isDark ? '#0b1220' : '#4F46E5' }} className="text-white p-6 pb-12 rounded-b-3xl">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <UserCircle className="text-indigo-600" size={60} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: isDark ? '#E6EEF8' : '#FFFFFF' }}>John Doe</h1>
          <p className="text-indigo-100">john.doe@alu.edu</p>
        </div>
      </div>

      <div className="p-6 -mt-6 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-4" style={{ background: isDark ? '#071025' : '#FFFFFF', color: isDark ? '#E6EEF8' : '#0F172A' }}>
          <h3 className="font-bold text-gray-800 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <div className="text-sm font-medium" style={{ color: isDark ? '#AFC6E8' : '#0F172A' }}>john.doe@alu.edu</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Phone</label>
              <div className="text-sm font-medium" style={{ color: isDark ? '#AFC6E8' : '#0F172A' }}>+250 788 000 000</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-1">Resume</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="application/pdf,application/msword" onChange={handleResumeUpload} />
                <div className="text-sm text-gray-600">{resumeFile ? resumeFile : 'No resume uploaded'}</div>
              </div>
            </div>
          </div>
        </div>

  <div className="content-card mb-4" style={{ background: isDark ? '#071025' : '#FFFFFF', color: isDark ? '#E6EEF8' : '#0F172A' }}>
          <h3 className="font-bold mb-3">ID Verification</h3>
          {!idVerified ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">Verify your student ID to unlock all features</p>
              <button 
                onClick={() => setIdVerified(true)}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Upload Student ID
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">Verified Student</span>
            </div>
          )}
        </div>

  <div className="content-card mb-4" style={{ background: isDark ? '#071025' : '#FFFFFF', color: isDark ? '#E6EEF8' : '#0F172A' }}>
          <h3 className="font-bold mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm">Tutoring</span>
            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm">Tech Support</span>
          </div>
        </div>

  <div className="content-card" style={{ background: isDark ? '#071025' : '#FFFFFF' }}>
          <button className="w-full text-left py-2 text-gray-700 hover:text-indigo-600">Account Settings</button>
          <button className="w-full text-left py-2 text-gray-700 hover:text-indigo-600">Help & Support</button>
          <button className="w-full text-left py-2 text-gray-700 hover:text-indigo-600">Contact Admin</button>
          <button className="w-full text-left py-2 text-red-600 hover:text-red-700">Log Out</button>
        </div>
      </div>
    </div>
  );

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <button 
          onClick={() => setCurrentPage('home')}
          className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <Home size={24} />
          <span className="text-xs">Home</span>
        </button>
        <button 
          onClick={() => setCurrentPage('chats')}
          className={`flex flex-col items-center gap-1 ${currentPage === 'chats' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <MessageSquare size={24} />
          <span className="text-xs">Chats</span>
        </button>
        <button 
          onClick={() => setCurrentPage('notifications')}
          className={`flex flex-col items-center gap-1 relative ${currentPage === 'notifications' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <Bell size={24} />
          <span className="text-xs">Alerts</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="absolute top-0 right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setCurrentPage('profile')}
          className={`flex flex-col items-center gap-1 ${currentPage === 'profile' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <UserCircle size={24} />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return currentPage === 'signup' ? renderSignup() : renderLogin();
  }

  return (
    <div className="page-wrap prod-typography" style={{ fontFamily: 'Montserrat, system-ui, -apple-system' }}>
      <div className="single-strand" style={{ width: '100%' }}>
        {selectedGig && renderGigDetail()}
        {selectedChat && renderChatDetail()}
        {!selectedGig && !selectedChat && (
          <>
            {currentPage === 'home' && (userType === 'student' ? renderHome() : userType === 'provider' ? renderProviderHome() : renderAdminHome())}
            {currentPage === 'chats' && renderChats()}
            {currentPage === 'notifications' && renderNotifications()}
            {currentPage === 'profile' && renderProfile()}
          </>
        )}

        {renderBottomNav()}
      </div>
    </div>
  );
}
