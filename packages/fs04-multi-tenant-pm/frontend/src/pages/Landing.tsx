import { Link } from 'react-router-dom';

const COLLAB_URL = import.meta.env.VITE_COLLAB_URL || 'http://localhost:3002';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-secondary-900 mb-3">Crispy Fortnight</h1>
          <p className="text-lg text-secondary-600">One hub. Two projects. Pick what you want to build today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Management Platform (FS-04) */}
          <Link
            to="/dashboard"
            className="card block p-8 hover:shadow-xl transition-all hover:-translate-y-1 group text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Project Management Platform</h2>
                <p className="text-sm text-secondary-500">Manage projects, issues, sprints, and teams</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary-600 font-medium">
              <span>Launch Project Management</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Collaborative Workspace */}
          <a
            href={`${COLLAB_URL}/dashboard`}
            className="card p-8 hover:shadow-xl transition-all hover:-translate-y-1 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Collaborative Workspace</h2>
                <p className="text-sm text-secondary-500">Real-time document collaboration & workspaces</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <span>Launch Collaborative Workspace</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>

        <div className="mt-8 text-center text-sm text-secondary-500">
          <p>Both applications share the same authentication system.</p>
          <p className="mt-1">Project Management: demo@fs04.local • Collaborative Workspace: demo@fs02.local • Password: password123</p>
        </div>
      </div>
    </div>
  );
}