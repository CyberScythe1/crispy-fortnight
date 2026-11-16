import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MoreHorizontal, Users, Calendar, ClipboardList, Search, Filter } from 'lucide-react';
import { issueApi, projectApi, userApi, sprintApi } from '../services/api';
import toast from 'react-hot-toast';

interface Issue {
  id: string;
  key: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  sprintId: string | null;
  projectId: string;
}

interface Project {
  id: string;
  key: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
}

interface Sprint {
  id: string;
  name: string;
}

export default function Backlog() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', type: 'TASK', priority: 'MEDIUM', description: '' });

  const fetchIssues = async () => {
    if (!projectId) return;
    try {
      const res = await issueApi.list({ projectId, limit: 500, sortBy, sortOrder, status: statusFilter !== 'all' ? statusFilter : undefined });
      setIssues(res.data.data);
    } catch (error) {
      toast.error('Failed to load backlog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [projectId, sortBy, sortOrder, statusFilter]);

  const filteredIssues = issues.filter(i => 
    (!search || i.title.toLowerCase().includes(search.toLowerCase()) || i.key.toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === 'all' || i.type === typeFilter)
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      TODO: 'badge-secondary',
      BACKLOG: 'badge-secondary',
      IN_PROGRESS: 'badge-primary',
      IN_REVIEW: 'badge-warning',
      DONE: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return colors[status] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Backlog</h1>
            <p className="text-secondary-500">Prioritize and manage your work items</p>
          </div>
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Issue
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-secondary-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-40">
                <option value="all">All Status</option>
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-40">
                <option value="all">All Types</option>
                <option value="TASK">Task</option>
                <option value="STORY">Story</option>
                <option value="BUG">Bug</option>
                <option value="EPIC">Epic</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input w-40">
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input w-24">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Issue</th>
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Type</th>
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Status</th>
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Priority</th>
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Assignee</th>
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Updated</th>
                <th className="p-4 text-right text-sm font-medium text-secondary-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-secondary-500">
                    No issues found. <button onClick={() => setShowCreateModal(true)} className="text-primary-600 hover:underline">Create your first issue</button>
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="p-4">
                      <button className="flex items-center gap-3 hover:text-primary-600">
                        <span className="font-mono text-secondary-700">{issue.key}</span>
                        <span className="font-medium text-secondary-900 truncate max-w-xs">{issue.title}</span>
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${issue.type === 'BUG' ? 'badge-danger' : issue.type === 'STORY' ? 'badge-primary' : 'badge-secondary'}`}>
                        {issue.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span>
                    </td>
                    <td className="p-4 text-secondary-500">Unassigned</td>
                    <td className="p-4 text-sm text-secondary-500">{new Date(issue.updatedAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors" title="Edit">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    TODO: 'badge-secondary',
    BACKLOG: 'badge-secondary',
    IN_PROGRESS: 'badge-primary',
    IN_REVIEW: 'badge-warning',
    DONE: 'badge-success',
    CANCELLED: 'badge-danger',
  };
  return colors[status] || 'badge-secondary';
}

function getPriorityBadge(priority: string) {
  const colors: Record<string, string> = {
    LOW: 'badge-secondary',
    MEDIUM: 'badge-primary',
    HIGH: 'badge-warning',
    CRITICAL: 'badge-danger',
  };
  return colors[priority] || 'badge-secondary';
}