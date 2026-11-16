import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MoreHorizontal, Calendar, Users, CheckCircle, Flag } from 'lucide-react';
import { sprintApi, issueApi, projectApi, userApi } from '../services/api';
import toast from 'react-hot-toast';

interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  projectId: string;
}

interface Issue {
  id: string;
  key: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  sprintId: string | null;
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

const sprintStatuses = [
  { id: 'planned', label: 'Planned', color: 'bg-gray-100 text-gray-700' },
  { id: 'active', label: 'Active', color: 'bg-blue-100 text-blue-700' },
  { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

export default function SprintBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });

  const fetchData = async () => {
    if (!projectId) return;
    try {
      const [sprintsRes, issuesRes] = await Promise.all([
        sprintApi.list({ projectId, limit: 100, sortBy: 'startDate', sortOrder: 'asc' }),
        issueApi.list({ projectId, limit: 500, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setSprints(sprintsRes.data.data);
      setIssues(issuesRes.data.data);
    } catch (error) {
      toast.error('Failed to load sprint board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const getSprintIssues = (sprintId: string) => issues.filter(i => i.sprintId === sprintId);
  const getBacklogIssues = () => issues.filter(i => !i.sprintId);

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
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Sprint Board</h1>
          <p className="text-secondary-500">Manage your sprints and backlog</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Sprint
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Create Sprint</h2>
            <form onSubmit={(e) => { e.preventDefault(); setShowCreateModal(false); }} className="space-y-4">
              <div>
                <label className="label">Sprint Name</label>
                <input type="text" value={newSprint.name} onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Goal</label>
                <textarea value={newSprint.goal} onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })} className="input" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={newSprint.startDate} onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={newSprint.endDate} onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })} className="input" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Sprint</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          <div className="w-96 bg-secondary-50 rounded-xl border border-secondary-200 flex flex-col">
            <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">Backlog</h3>
              <span className="badge badge-secondary">{getBacklogIssues().length}</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {getBacklogIssues().map((issue) => (
                <div key={issue.id} className="p-3 bg-white rounded-lg border border-secondary-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-secondary-700">{issue.key}</span>
                    <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                  </div>
                  <p className="text-sm font-medium text-secondary-900 mt-1 truncate">{issue.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge ${issue.type === 'BUG' ? 'badge-danger' : issue.type === 'STORY' ? 'badge-primary' : 'badge-secondary'}`}>{issue.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {sprints.map((sprint) => {
            const sprintIssues = getSprintIssues(sprint.id);
            const statusConfig = sprintStatuses.find(s => s.id === sprint.status) || sprintStatuses[0];
            return (
              <div key={sprint.id} className="w-96 bg-white rounded-xl border border-secondary-200 flex flex-col">
                <div className={`p-4 border-b border-secondary-200 flex items-center justify-between ${statusConfig.color}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <h3 className="font-semibold">{sprint.name}</h3>
                  </div>
                  <span className="badge badge-secondary">{sprintIssues.length}</span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-2">
                  {sprintIssues.length === 0 ? (
                    <p className="text-center text-secondary-500 py-8">No issues in this sprint</p>
                  ) : (
                    sprintIssues.map((issue) => (
                      <div key={issue.id} className="p-3 bg-secondary-50 rounded-lg border border-secondary-200 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm text-secondary-700">{issue.key}</span>
                          <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                        </div>
                        <p className="text-sm font-medium text-secondary-900 mt-1 truncate">{issue.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`badge ${issue.type === 'BUG' ? 'badge-danger' : issue.type === 'STORY' ? 'badge-primary' : 'badge-secondary'}`}>{issue.type}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-secondary-200">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>{sprintStatuses.find(s => s.id === sprint.status)?.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Create Sprint</h2>
            <form onSubmit={(e) => { e.preventDefault(); setShowCreateModal(false); }} className="space-y-4">
              <div>
                <label className="label">Sprint Name</label>
                <input type="text" value={newSprint.name} onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Goal</label>
                <textarea value={newSprint.goal} onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })} className="input" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={newSprint.startDate} onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={newSprint.endDate} onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })} className="input" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Sprint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}