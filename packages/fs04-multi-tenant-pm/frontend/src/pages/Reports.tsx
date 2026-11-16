import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, ClipboardList, Users, Briefcase } from 'lucide-react';
import { projectApi, issueApi, sprintApi, userApi } from '../services/api';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  visibility: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

interface Issue {
  id: string;
  key: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  reporterId: string;
  projectId: string;
  sprintId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  projectId: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
}

export default function Reports() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchData = async () => {
    if (!projectId) return;
    try {
      const [projectRes, issuesRes, sprintsRes, usersRes] = await Promise.all([
        projectApi.get(projectId),
        issueApi.list({ projectId, limit: 1000, sortBy: 'createdAt', sortOrder: 'desc' }),
        sprintApi.list({ projectId, limit: 100 }),
        userApi.list({ limit: 100 }),
      ]);
      setProject(projectRes.data.data);
      setIssues(issuesRes.data.data);
      setSprints(sprintsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

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

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      BUG: 'badge-danger',
      STORY: 'badge-primary',
      TASK: 'badge-secondary',
      EPIC: 'badge-warning',
    };
    return colors[type] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12 text-secondary-500">Project not found</div>;
  }

  const stats = {
    totalIssues: issues.length,
    openIssues: issues.filter(i => i.status !== 'DONE').length,
    doneIssues: issues.filter(i => i.status === 'DONE').length,
    inProgressIssues: issues.filter(i => i.status === 'IN_PROGRESS').length,
    inReviewIssues: issues.filter(i => i.status === 'IN_REVIEW').length,
    totalSprints: sprints.length,
    activeSprints: sprints.filter(s => s.status === 'active').length,
    completedSprints: sprints.filter(s => s.status === 'completed').length,
    teamMembers: users.length,
  };

  const issuesByStatus = issues.reduce((acc, issue) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const issuesByType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const issuesByPriority = issues.reduce((acc, issue) => {
    acc[issue.priority] = (acc[issue.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Reports</h1>
          <p className="text-secondary-500">Insights and analytics for {project.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Issues</p>
              <p className="text-3xl font-bold text-secondary-900 mt-1">{stats.totalIssues}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500 text-white">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Open Issues</p>
              <p className="text-3xl font-bold text-secondary-900 mt-1">{stats.openIssues}</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500 text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Completed</p>
              <p className="text-3xl font-bold text-secondary-900 mt-1">{stats.doneIssues}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500 text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">In Progress</p>
              <p className="text-3xl font-bold text-secondary-900 mt-1">{stats.inProgressIssues}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500 text-white">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">Issues by Status</h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(issuesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge ${getStatusBadge(status)}`}>{status}</span>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1 h-2 bg-secondary-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${stats.totalIssues > 0 ? (count / stats.totalIssues) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-secondary-700 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">Issues by Type</h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(issuesByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge ${getTypeBadge(type)}`}>{type}</span>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1 h-2 bg-secondary-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${stats.totalIssues > 0 ? (count / stats.totalIssues) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-secondary-700 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">Issues by Priority</h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(issuesByPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge ${getPriorityBadge(priority)}`}>{priority}</span>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1 h-2 bg-secondary-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${stats.totalIssues > 0 ? (count / stats.totalIssues) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-secondary-700 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">Sprint Progress</h2>
          </div>
          <div className="p-6 space-y-4">
            {sprints.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">No sprints yet</div>
            ) : (
              sprints.map((sprint: any) => (
                <div key={sprint.id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-secondary-900">{sprint.name}</h3>
                      <p className="text-sm text-secondary-500">{sprint.goal || 'No goal set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${sprint.status === 'active' ? 'badge-primary' : sprint.status === 'completed' ? 'badge-success' : sprint.status === 'planned' ? 'badge-secondary' : 'badge-danger'}`}>
                      {sprint.status}
                    </span>
                    <span className="text-sm text-secondary-500">
                      {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">Team Activity</h2>
          </div>
          <div className="p-6 space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">No team members</div>
            ) : (
              users.slice(0, 10).map((user: any) => (
                <div key={user.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-primary-700">{user.firstName[0]}{user.lastName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary-900 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-secondary-500">{user.email}</p>
                  </div>
                  <span className={`badge ${user.role === 'OWNER' ? 'badge-danger' : user.role === 'ADMIN' ? 'badge-warning' : 'badge-secondary'}`}>
                    {user.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}