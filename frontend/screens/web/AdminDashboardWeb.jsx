import React from 'react';
import { UserCircle } from 'lucide-react';

export default function AdminDashboardWeb({ gigs = [] }) {
  return (
    <div className="page-wrap prod-typography">
      <div className="single-strand">
        <div className="content-card mb-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Site analytics and moderation tools</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full">
                <UserCircle size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
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

          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Site Activity</h3>
            <div className="h-40 bg-gradient-to-r from-indigo-50 to-white rounded-lg flex items-center justify-center text-indigo-300">Chart placeholder</div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold">Approve Gigs</button>
            <button className="w-full bg-white border border-gray-200 py-3 rounded-xl">Manage Users</button>
          </div>
        </div>
      </div>
    </div>
  );
}
