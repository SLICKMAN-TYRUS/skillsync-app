import React from 'react';
import { Home, MessageSquare, Bell, UserCircle } from 'lucide-react';

export default function NavMenu({ current = 'home', onNavigate = () => {}, unread = 0 }) {
  const items = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'chats', label: 'Chats', icon: MessageSquare },
    { key: 'notifications', label: 'Alerts', icon: Bell },
    { key: 'profile', label: 'Profile', icon: UserCircle }
  ];

  return (
    <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        {items.map(it => {
          const Icon = it.icon;
          const active = current === it.key;
          return (
            <button key={it.key} onClick={() => onNavigate(it.key)} className={`flex flex-col items-center gap-1 ${active ? 'text-indigo-600' : 'text-gray-400'}`} aria-label={it.label}>
              <div style={{ position: 'relative' }}>
                <Icon size={22} />
                {it.key === 'notifications' && unread > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>
                )}
              </div>
              <span className="text-xs">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
