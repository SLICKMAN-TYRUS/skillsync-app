import React from 'react';
import { UserCircle, Moon, Sun } from 'lucide-react';

export default function ProviderDashboardWeb({ gigs = [], isDark, setIsDark }) {
  const earnings = gigs.reduce((a, g) => a + (parseInt((g.pay || '').replace(/\D/g, '')) || 0), 0);

  return (
    <main className="page-wrap prod-typography" role="main" aria-label="Provider Dashboard">
      <div className="single-strand">
        <div className="content-card" role="region" aria-label="Provider header">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Provider Dashboard</h1>
              <p className="text-sm text-gray-600">Overview of your gigs, applications and earnings</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDark && setIsDark(d => !d)}
                title="Toggle theme"
                aria-label="Toggle theme"
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-gray-700 flex items-center"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="bg-white p-2 rounded-full" aria-hidden="true">
                <UserCircle size={22} />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="content-card" role="status" aria-label="Active gigs">
              <div className="text-sm text-gray-500">Active Gigs</div>
              <div className="text-xl font-bold text-gray-800">{gigs.length}</div>
            </div>
            <div className="content-card" role="status" aria-label="Applications">
              <div className="text-sm text-gray-500">Applications</div>
              <div className="text-xl font-bold text-gray-800">{gigs.reduce((a, g) => a + (g.applicantsCount || 0), 0)}</div>
            </div>
            <div className="content-card" role="status" aria-label="Completed gigs">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-xl font-bold text-gray-800">{gigs.filter(g => g.status === 'completed').length}</div>
            </div>
            <div className="content-card" role="status" aria-label="Earnings">
              <div className="text-sm text-gray-500">Earnings</div>
              <div className="text-xl font-bold text-indigo-600">{earnings} RWF</div>
            </div>
          </div>
        </div>

        <div className="content-card" role="region" aria-label="Earnings overview">
          <h3 className="font-bold text-gray-800 mb-3">Earnings Overview</h3>
          <div className="h-40 bg-gradient-to-r from-indigo-50 to-white rounded-lg flex items-center justify-center text-indigo-300">Chart placeholder</div>
        </div>

        <div className="content-card" role="region" aria-label="Quick actions">
          <div className="grid md:grid-cols-3 gap-4">
            <button className="bg-indigo-600 text-white py-3 rounded-xl font-semibold">Post New Gig</button>
            <button className="bg-white border border-gray-200 py-3 rounded-xl">View Applications</button>
            <button className="bg-white border border-gray-200 py-3 rounded-xl">Check Ratings</button>
          </div>
        </div>
      </div>
    </main>
  );
}
