import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, MapPin, Briefcase, Home, MessageSquare, Bell, UserCircle, Search, Clock, DollarSign, CheckCircle, Upload, Send, ArrowLeft, Moon, Sun } from 'lucide-react';
import ProviderDashboardWeb from '../screens/web/ProviderDashboardWeb';
import AdminDashboardWeb from '../screens/web/AdminDashboardWeb';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ProviderLanding from '../screens/home/ProviderLanding';
import AdminLanding from '../screens/home/AdminLanding';
import StudentLanding from '../screens/home/StudentLanding';
import NavMenu from './NavMenu';

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

  // Demo mode: allow viewing landing screens directly via URL query param ?demo=student|provider|admin
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const demo = (params.get('demo') || params.get('view') || '').toLowerCase();
      if (demo && ['student', 'provider', 'admin'].includes(demo)) {
        setUserType(demo);
        setIsLoggedIn(true);
        setCurrentPage('home');
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  }, []);

  const renderSignup = () => (
    <SignupScreen onSignup={(data, role) => { setIsLoggedIn(true); setUserType(role || 'student'); setCurrentPage('home'); }} onSwitchToLogin={() => setCurrentPage('login')} />
  );

  const renderLogin = () => (
    <LoginScreen onLogin={(data, role) => { setIsLoggedIn(true); setUserType(role || 'student'); setCurrentPage('home'); }} onSwitchToSignup={() => setCurrentPage('signup')} />
  );

  const renderHome = () => {
    const commonProps = {
      gigs,
      onNavigate: (page) => { setCurrentPage(page); setSelectedGig(null); setSelectedChat(null); },
      unread: notifications.filter(n => !n.read).length
    };

    if (userType === 'provider') return <ProviderLanding {...commonProps} />;
    if (userType === 'admin') return <AdminLanding {...commonProps} />;
    return <StudentLanding {...commonProps} />;
  };

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
      <div className="content-card">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div className="single-strand">
          {chats.map(chat => (
            <div key={chat.id} className="list-item" onClick={() => setSelectedChat(chat)}>
              <div style={{flexShrink:0}}>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="text-indigo-600" size={22} />
                </div>
              </div>
              <div className="meta" style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                  <h3 className="font-semibold text-gray-800" style={{margin:0}}>{chat.name}</h3>
                  <span className="text-xs muted">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-600" style={{margin:0,marginTop:6}}>{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div style={{marginLeft:12}}>
                  <div className="bg-indigo-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">{chat.unread}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChatDetail = () => (
    <div className="min-h-screen bg-gray-50 pb-20 flex flex-col">
      <div className="content-card" style={{display:'flex',alignItems:'center',gap:12}}>
        <button onClick={() => setSelectedChat(null)} style={{background:'transparent',border:'none'}}>
          <ArrowLeft size={22} />
        </button>
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <User className="text-indigo-600" size={24} />
        </div>
        <div style={{flex:1}}>
          <h2 className="font-bold text-gray-800" style={{margin:0}}>{selectedChat.name}</h2>
          <p className="text-xs text-gray-500" style={{margin:0}}>Online</p>
        </div>
      </div>

      <div className="content-card" style={{flex:1,display:'flex',flexDirection:'column',gap:12,overflowY:'auto',padding:'1rem'}}>
        <div style={{display:'flex',justifyContent:'flex-start'}}>
          <div className="list-item" style={{maxWidth:'60%'}}>
            <p className="text-gray-800" style={{margin:0}}>Hi! I saw your application for the tutoring gig.</p>
            <span className="text-xs muted" style={{marginTop:6}}>10:30 AM</span>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <div className="list-item" style={{background:'var(--primary)',color:'#fff',maxWidth:'60%'}}>
            <p style={{margin:0}}>Yes! I'm very interested in helping.</p>
            <span className="text-xs" style={{marginTop:6,color:'rgba(255,255,255,0.85)'}}>10:32 AM</span>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'flex-start'}}>
          <div className="list-item" style={{maxWidth:'60%'}}>
            <p className="text-gray-800" style={{margin:0}}>{selectedChat.lastMessage}</p>
            <span className="text-xs muted" style={{marginTop:6}}>10:35 AM</span>
          </div>
        </div>
      </div>

      <div className="content-card" style={{marginTop:12}}>
        <div style={{display:'flex',gap:8}}>
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
      <div className="content-card">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div className="single-strand">
          {notifications.map(notif => (
            <div key={notif.id} className="list-item">
              <div style={{flexShrink:0}}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.read ? 'bg-gray-100' : 'bg-indigo-100'}`}>
                  <Bell className={notif.read ? 'text-gray-400' : 'text-indigo-600'} size={18} />
                </div>
              </div>
              <div style={{flex:1}}>
                <p className={`${notif.read ? 'text-sm text-gray-600' : 'text-sm text-gray-800 font-medium'}`} style={{margin:0}}>{notif.text}</p>
                <span className="text-xs muted" style={{marginTop:6,display:'block'}}>{notif.time}</span>
              </div>
            </div>
          ))}
        </div>
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
      <div style={{ background: isDark ? '#0b1220' : 'var(--primary)' }} className="text-white p-6 pb-12 rounded-b-3xl">
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

  // Bottom navigation is provided by the shared NavMenu component

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

        <NavMenu current={currentPage} onNavigate={(p) => setCurrentPage(p)} unread={notifications.filter(n => !n.read).length} />
      </div>
    </div>
  );
}
