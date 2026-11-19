import { useAuth } from '../context/AuthContext';
import { FolderOpen, FileText, Users, TrendingUp } from 'lucide-react';
import { workspaceApi, documentApi } from '../services/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const statCards = [
  { name: 'Workspaces', icon: FolderOpen, color: 'bg-green-500', href: '/workspaces' },
  { name: 'Documents', icon: FileText, color: 'bg-blue-500', href: '/documents' },
  { name: 'Team Members', icon: Users, color: 'bg-purple-500', href: '/workspaces' },
  { name: 'Recent Activity', icon: TrendingUp, color: 'bg-orange-500', href: '/dashboard' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ workspaces: 0, documents: 0, members: 0, activity: 0 });
  const [recentWorkspaces, setRecentWorkspaces] = useState<any[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [workspacesRes, docsRes] = await Promise.all([
          workspaceApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          documentApi.list({ limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
        ]);
        setStats({ workspaces: workspacesRes.data.meta?.totalItems || 0, documents: docsRes.data.meta?.totalItems || 0, members: 0, activity: 0 });
        setRecentWorkspaces(workspacesRes.data.data);
        setRecentDocuments(docsRes.data.data);
      } catch (error) { console.error('Failed to fetch dashboard data:', error); }
      finally { setLoading(false); }
    };
    fetchDashboardData();
  }, []);

  const getStatValue = (name: string) => { switch (name) { case 'Workspaces': return stats.workspaces; case 'Documents': return stats.documents; case 'Team Members': return stats.members; case 'Recent Activity': return stats.activity; default: return 0; } };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-secondary-900">Welcome back, {user?.firstName}!</h1><p className="text-secondary-600">Here's what's happening in your workspaces today.</p></div>
        <div className="flex items-center gap-2"><span className="badge bg-green-100 text-green-800">{user?.role === 'OWNER' ? 'Owner' : 'Member'}</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (<Link key={stat.name} to={stat.href} className="card p-6 hover:shadow-md transition-shadow"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-secondary-600">{stat.name}</p><p className="text-3xl font-bold text-secondary-900 mt-1">{getStatValue(stat.name)}</p></div><div className={`p-3 rounded-xl ${stat.color} text-white`}><stat.icon className="w-6 h-6" /></div></div></Link>))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><div className="p-6 border-b border-secondary-200 flex items-center justify-between"><h2 className="text-lg font-semibold text-secondary-900">Recent Workspaces</h2><Link to="/workspaces" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link></div><div className="divide-y divide-secondary-200">{loading ? <div className="p-6 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto"></div></div> : recentWorkspaces.length === 0 ? <div className="p-6 text-center text-secondary-500">No workspaces yet. <Link to="/workspaces" className="text-primary-600">Create your first workspace</Link></div> : recentWorkspaces.map((ws) => (<Link key={ws.id} to={`/workspaces/${ws.id}`} className="p-4 flex items-center justify-between hover:bg-secondary-50"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><FolderOpen className="w-6 h-6 text-green-600" /></div><div><p className="font-medium text-secondary-900">{ws.name}</p><p className="text-sm text-secondary-500">{ws.slug}</p></div></div><span className="badge badge-success">Active</span></Link>))} </div></div>
        <div className="card"><div className="p-6 border-b border-secondary-200 flex items-center justify-between"><h2 className="text-lg font-semibold text-secondary-900">Recent Documents</h2><Link to="/documents" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link></div><div className="divide-y divide-secondary-200">{loading ? <div className="p-6 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto"></div></div> : recentDocuments.length === 0 ? <div className="p-6 text-center text-secondary-500">No documents yet</div> : recentDocuments.map((doc) => (<Link key={doc.id} to={`/workspaces/${doc.workspaceId}`} className="p-4 flex items-center justify-between hover:bg-secondary-50"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-blue-600" /></div><div><p className="font-medium text-secondary-900">{doc.title}</p><p className="text-sm text-secondary-500">{doc.type}</p></div></div><span className="text-sm font-medium text-secondary-900">{format(new Date(doc.updatedAt), 'MMM d, yyyy')}</span></Link>))} </div></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/workspaces" className="card p-6 hover:shadow-md transition-shadow"><FolderOpen className="w-8 h-8 text-primary-600 mb-2" /><h3 className="font-semibold text-secondary-900">Create Workspace</h3><p className="text-sm text-secondary-500 mt-1">Start a new collaborative workspace</p></Link>
        <Link to="/workspaces" className="card p-6 hover:shadow-md transition-shadow"><FileText className="w-8 h-8 text-green-600 mb-2" /><h3 className="font-semibold text-secondary-900">New Document</h3><p className="text-sm text-secondary-500 mt-1">Create a new document</p></Link>
        <Link to="/workspaces" className="card p-6 hover:shadow-md transition-shadow"><Users className="w-8 h-8 text-purple-600 mb-2" /><h3 className="font-semibold text-secondary-900">Invite Team</h3><p className="text-sm text-secondary-500 mt-1">Add members to your workspace</p></Link>
        <Link to="/settings" className="card p-6 hover:shadow-md transition-shadow"><TrendingUp className="w-8 h-8 text-orange-600 mb-2" /><h3 className="font-semibold text-secondary-900">Settings</h3><p className="text-sm text-secondary-500 mt-1">Manage preferences</p></Link>
      </div>
    </div>
  );
}
