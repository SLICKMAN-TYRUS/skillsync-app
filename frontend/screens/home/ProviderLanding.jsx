import React from 'react';
import NavMenu from '../../components/NavMenu';
import { UserCircle } from 'lucide-react';

export default function ProviderLanding({ gigs = [], onNavigate, unread = 0 }) {
  const earnings = gigs.reduce((a, g) => a + (parseInt((g.pay || '').replace(/\D/g, '')) || 0), 0);

  return (
    <main className="page-wrap prod-typography" role="main">
      <div className="single-strand">
        <div className="content-card">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold">Provider Home</h1>
              <p className="text-sm text-gray-600">Manage gigs, view applications and earnings</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full" aria-hidden="true"><UserCircle size={22} /></div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="content-card" role="status">
              <div className="text-sm text-gray-500">Active Gigs</div>
              <div className="text-xl font-bold text-gray-800">{gigs.length}</div>
            </div>
            <div className="content-card">
              <div className="text-sm text-gray-500">Applications</div>
              <div className="text-xl font-bold text-gray-800">{gigs.reduce((a, g) => a + (g.applicantsCount || 0), 0)}</div>
            </div>
            <div className="content-card">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-xl font-bold text-gray-800">{gigs.filter(g => g.status === 'completed').length}</div>
            </div>
            <div className="content-card">
              <div className="text-sm text-gray-500">Earnings</div>
              <div className="text-xl font-bold text-indigo-600">{earnings} RWF</div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3 className="font-bold text-gray-800 mb-3">Your recent gigs</h3>
          <div className="space-y-3">
            {gigs.slice(0,3).map(g => (
              <div key={g.id} className="content-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{g.title}</h4>
                    <p className="text-sm text-gray-600">{g.location} • {g.category}</p>
                  </div>
                  <div className="text-indigo-600 font-bold">{g.pay}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NavMenu current="home" onNavigate={onNavigate} unread={unread} />
    </main>
  );
}
