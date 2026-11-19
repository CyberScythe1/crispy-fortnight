import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MoreHorizontal, Users, Calendar, ClipboardList, ChevronDown } from 'lucide-react';
import { issueApi, projectApi, userApi, sprintApi } from '../services/api';
import toast from 'react-hot-toast';

interface Issue {
  id: string;
  key: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  reporterId: string;
  projectId: string;
  sprintId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; firstName: string; lastName: string; email: string; avatar: string } | null;
  reporter: { id: string; firstName: string; lastName: string; email: string; avatar: string } | null;
  project: { id: string; key: string; name: string } | null;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
}

interface Project {
  id: string;
  key: string;
  name: string;
}

interface Sprint {
  id: string;
  name: string;
}

export default function IssueDetail() {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const fetchIssue = async () => {
    if (!projectId || !issueId) return;
    try {
      const [issueRes, usersRes, projectsRes, sprintsRes] = await Promise.all([
        issueApi.get(projectId, issueId),
        userApi.list({ limit: 100 }),
        projectApi.list({ limit: 100 }),
        sprintApi.list({ projectId, limit: 100 }),
      ]);
      setIssue(issueRes.data.data);
      setUsers(usersRes.data.data);
      setProjects(projectsRes.data.data);
      setSprints(sprintsRes.data.data);
    } catch (error) {
      toast.error('Failed to load issue');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [projectId, issueId]);

  const handleDelete = async () => {
    if (!projectId || !issueId) return;
    try {
      await issueApi.delete(projectId, issueId);
      toast.success('Issue deleted');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      toast.error('Failed to delete issue');
    }
  };

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

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'badge-secondary',
      MEDIUM: 'badge-primary',
      HIGH: 'badge-warning',
      CRITICAL: 'badge-danger',
    };
    return colors[priority] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!issue) {
    return <div className="text-center py-12 text-secondary-500">Issue not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/projects/${projectId}`)} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-secondary-500">{issue.project?.key}-{issue.key.split('-').pop()}</span>
            <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">{issue.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Description</h2>
            </div>
            <div className="p-6">
              <div className="prose prose-secondary max-w-none whitespace-pre-wrap">{issue.description || 'No description provided'}</div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Activity</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-secondary-500">No activity yet</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Type</label>
                <span className={`badge ${issue.type === 'BUG' ? 'badge-danger' : issue.type === 'STORY' ? 'badge-primary' : issue.type === 'TASK' ? 'badge-secondary' : 'badge-warning'}`}>
                  {issue.type}
                </span>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  defaultValue={issue.status}
                  className="input"
                  onChange={(e) => {}}
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span>
              </div>
              <div>
                <label className="label">Assignee</label>
                <select defaultValue={issue.assigneeId || ''} className="input">
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Reporter</label>
                <p className="text-secondary-700">{issue.reporter?.firstName} {issue.reporter?.lastName}</p>
              </div>
              <div>
                <label className="label">Project</label>
                <p className="text-secondary-700">{issue.project?.key} - {issue.project?.name}</p>
              </div>
              <div>
                <label className="label">Created</label>
                <p className="text-secondary-700">{new Date(issue.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="label">Updated</label>
                <p className="text-secondary-700">{new Date(issue.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="card border-red-200 bg-red-50">
            <div className="p-6">
              <h3 className="font-medium text-red-900">Danger Zone</h3>
              <p className="text-red-700 mt-2">Once deleted, this issue cannot be recovered.</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn-danger mt-4 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Issue
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Delete Issue</h2>
            <p className="text-secondary-600 mb-6">Are you sure you want to delete "{issue?.title}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete Issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}