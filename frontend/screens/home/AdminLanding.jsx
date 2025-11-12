import React from 'react';
import NavMenu from '../../components/NavMenu';
import { UserCircle } from 'lucide-react';

export default function AdminLanding({ gigs = [], onNavigate, unread = 0 }) {
  return (
    <main className="page-wrap prod-typography" role="main">
      <div className="single-strand">
        <div className="content-card">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold">Admin Home</h1>
              <p className="text-sm text-gray-600">Site overview and moderation tools</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full" aria-hidden="true"><UserCircle size={22} /></div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="content-card">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-xl font-bold text-gray-800">1,234</div>
            </div>
            <div className="content-card">
              <div className="text-sm text-gray-500">Active Gigs</div>
              <div className="text-xl font-bold text-gray-800">{gigs.length}</div>
            </div>
            <div className="content-card">
              <div className="text-sm text-gray-500">Pending Approvals</div>
              <div className="text-xl font-bold text-gray-800">12</div>
            </div>
            <div className="content-card">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-xl font-bold text-gray-800">{gigs.filter(g => g.status === 'completed').length}</div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3 className="font-bold text-gray-800 mb-3">Moderation</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold">Approve Gigs</button>
            <button className="w-full bg-white border border-gray-200 py-3 rounded-xl">Manage Users</button>
          </div>
        </div>
      </div>

      <NavMenu current="home" onNavigate={onNavigate} unread={unread} />
    </main>
  );
}
