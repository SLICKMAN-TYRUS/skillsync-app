import React, { useState } from 'react';
import { Mail, Lock, User, MapPin, Briefcase, Home, MessageSquare, Bell, UserCircle, Search, Clock, DollarSign, CheckCircle, Upload, Send, ArrowLeft } from 'lucide-react';

export default function SkillSyncApp() {
  const [currentPage, setCurrentPage] = useState('signup');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState('student');
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

  const renderSignup = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 mt-12">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Briefcase className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">SkillSync</h1>
          <p className="text-gray-600 mt-2">Connect. Earn. Grow.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="text" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="email" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="you@alu.edu" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="password" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="password" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill Category</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
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

            <button 
              onClick={() => {
                setIsLoggedIn(true);
                setCurrentPage('home');
              }}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors mt-6"
            >
              Sign Up
            </button>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button onClick={() => setCurrentPage('login')} className="text-indigo-600 font-semibold hover:underline">
                  Log In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 mt-12">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Briefcase className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Log in to continue</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Log In</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="email" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="you@alu.edu" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="password" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-indigo-600 hover:underline">Forgot password?</a>
            </div>

            <button 
              onClick={() => {
                setIsLoggedIn(true);
                setCurrentPage('home');
              }}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors mt-6"
            >
              Log In
            </button>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button onClick={() => setCurrentPage('signup')} className="text-indigo-600 font-semibold hover:underline">
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-6 pb-8 rounded-b-3xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hi, Student!</h1>
            <p className="text-indigo-100 text-sm">Find your next gig</p>
          </div>
          <div className="bg-indigo-500 p-3 rounded-full">
            <UserCircle size={24} />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-indigo-300" size={20} />
          <input 
            type="text" 
            placeholder="Search gigs..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-500 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['All', 'Tutoring', 'Tech', 'Events', 'Marketing'].map(cat => (
            <button key={cat} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${cat === 'All' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {gigs.map(gig => (
            <div key={gig.id} className="bg-white rounded-2xl p-5 shadow-sm" onClick={() => setSelectedGig(gig)}>
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
    </div>
  );

  const renderGigDetail = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-6">
        <button onClick={() => setSelectedGig(null)} className="mb-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">{selectedGig.title}</h1>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
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

  const renderProfile = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-indigo-600 text-white p-6 pb-12 rounded-b-3xl">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <UserCircle className="text-indigo-600" size={60} />
          </div>
          <h1 className="text-2xl font-bold">John Doe</h1>
          <p className="text-indigo-100">john.doe@alu.edu</p>
        </div>
      </div>

      <div className="p-6 -mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-gray-800 mb-4">ID Verification</h3>
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

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-gray-800 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm">Tutoring</span>
            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm">Tech Support</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-bold text-gray-800 mb-3">Location</h3>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={18} />
            <span>Kimironko, Kigali</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
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
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {selectedGig && renderGigDetail()}
      {selectedChat && renderChatDetail()}
      {!selectedGig && !selectedChat && (
        <>
          {currentPage === 'home' && renderHome()}
          {currentPage === 'chats' && renderChats()}
          {currentPage === 'notifications' && renderNotifications()}
          {currentPage === 'profile' && renderProfile()}
          {renderBottomNav()}
        </>
      )}
    </div>
  );
}
