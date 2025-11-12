import React from 'react';
import NavMenu from '../../components/NavMenu';
import { Search } from 'lucide-react';

export default function StudentLanding({ gigs = [], onNavigate, unread = 0 }) {
  return (
    <main className="page-wrap prod-typography" role="main">
      <div className="single-strand">
        <div className="content-card">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold">Find Gigs</h1>
              <p className="text-sm text-gray-600">Browse opportunities and apply</p>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-indigo-300" size={18} />
            <input placeholder="Search gigs, skills or locations" className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-50 text-gray-800" />
          </div>

          <div className="space-y-4">
            {gigs.map(g => (
              <div key={g.id} className="content-card">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{g.title}</h4>
                    <p className="text-sm text-gray-600">{g.provider} • {g.location}</p>
                  </div>
                  <div className="text-indigo-600 font-bold">{g.pay}</div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{g.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NavMenu current="home" onNavigate={onNavigate} unread={unread} />
    </main>
  );
}
