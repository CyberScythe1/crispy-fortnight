import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MoreHorizontal, Users, Settings, Briefcase, ClipboardList, Calendar, ChevronDown } from 'lucide-react';
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

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'sprints' | 'team' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchProject = async () => {
    if (!projectId) return;
    try {
      const [projectRes, issuesRes, sprintsRes, membersRes] = await Promise.all([
        projectApi.get(projectId),
        issueApi.list({ projectId, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        sprintApi.list({ projectId, limit: 10, sortBy: 'startDate', sortOrder: 'desc' }),
        userApi.list({ limit: 50 }),
      ]);
      setProject(projectRes.data.data);
      setIssues(issuesRes.data.data);
      setSprints(sprintsRes.data.data);
      setMembers(membersRes.data.data);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleDelete = async () => {
    if (!projectId) return;
    try {
      await projectApi.delete(projectId);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'issues', label: 'Issues', icon: ClipboardList },
    { id: 'sprints', label: 'Sprints', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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

  const getSprintStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'badge-secondary',
      active: 'badge-primary',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return colors[status] || 'badge-secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{project.name}</h1>
          <p className="text-secondary-500">Key: {project.key} • {project.visibility}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors" title="More options">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-secondary-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <h3 className="text-sm font-medium text-secondary-600">Description</h3>
                <p className="mt-2 text-secondary-700 whitespace-pre-wrap">{project.description || 'No description provided'}</p>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-secondary-600">Project Details</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Key</dt>
                    <dd className="font-mono font-medium text-secondary-900">{project.key}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Visibility</dt>
                    <dd>
                      <span className={`badge ${project.visibility === 'PUBLIC' ? 'badge-primary' : project.visibility === 'TEAM' ? 'badge-success' : 'badge-secondary'}`}>
                        {project.visibility}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Created</dt>
                    <dd className="text-secondary-700">{new Date(project.createdAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Updated</dt>
                    <dd className="text-secondary-700">{new Date(project.updatedAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>
              <div className="card p-6">
                <h3 className="text-sm font-medium text-secondary-600">Quick Stats</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Open Issues</dt>
                    <dd className="font-medium text-secondary-900">{issues.filter(i => i.status !== 'DONE').length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Total Issues</dt>
                    <dd className="font-medium text-secondary-900">{issues.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Active Sprints</dt>
                    <dd className="font-medium text-secondary-900">{sprints.filter(s => s.status === 'active').length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Team Members</dt>
                    <dd className="font-medium text-secondary-900">{members.length}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">Issues</h2>
              <button className="btn-primary flex items-center gap-2" onClick={() => {}}>
                <Plus className="w-4 h-4" />
                Create Issue
              </button>
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
                  </tr>
                </thead>
                <tbody>
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-secondary-500">No issues yet</td>
                    </tr>
                  ) : (
                    issues.map((issue) => (
                      <tr key={issue.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="p-4">
                          <button className="font-medium text-secondary-900 hover:text-primary-600">{issue.key} - {issue.title}</button>
                        </td>
                        <td className="p-4">
                          <span className={`badge ${issue.type === 'BUG' ? 'badge-danger' : issue.type === 'STORY' ? 'badge-primary' : issue.type === 'TASK' ? 'badge-secondary' : 'badge-warning'}`}>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sprints' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">Sprints</h2>
              <button className="btn-primary flex items-center gap-2">Create Sprint</button>
            </div>
            <div className="space-y-4">
              {sprints.length === 0 ? (
                <div className="text-center py-12 text-secondary-500">No sprints yet</div>
              ) : (
                sprints.map((sprint) => (
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
                      <span className={`badge ${getSprintStatusBadge(sprint.status)}`}>{sprint.status}</span>
                      <span className="text-sm text-secondary-500">
                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">Team Members</h2>
              <button className="btn-primary flex items-center gap-2">Add Member</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="p-4 text-left text-sm font-medium text-secondary-600">Member</th>
                    <th className="p-4 text-left text-sm font-medium text-secondary-600">Role</th>
                    <th className="p-4 text-left text-sm font-medium text-secondary-600">Email</th>
                    <th className="p-4 text-right text-sm font-medium text-secondary-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-secondary-500">No team members</td></tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="border-b border-secondary-100">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="font-medium text-primary-700">{member.firstName[0]}{member.lastName[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-900">{member.firstName} {member.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`badge ${member.role === 'OWNER' ? 'badge-danger' : member.role === 'ADMIN' ? 'badge-warning' : 'badge-secondary'}`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="p-4 text-secondary-500">{member.email}</td>
                        <td className="p-4 text-right">Edit</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-secondary-900">Project Settings</h2>
            <div className="card p-6 space-y-4">
              <h3 className="font-medium text-secondary-900">General</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Project Name</label>
                  <input type="text" defaultValue={project.name} className="input" />
                </div>
                <div>
                  <label className="label">Project Key</label>
                  <input type="text" defaultValue={project.key} className="input font-mono" maxLength={10} />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea defaultValue={project.description} className="input" rows={3} />
                </div>
                <div>
                  <label className="label">Visibility</label>
                  <select defaultValue={project.visibility} className="input">
                    <option value="TEAM">Team</option>
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary">Save Changes</button>
            </div>
            <div className="card p-6 border-red-200 bg-red-50">
              <h3 className="font-medium text-red-900">Danger Zone</h3>
              <p className="text-red-700 mt-2">Once deleted, this project and all its data cannot be recovered.</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn-danger mt-4 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Project
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Delete Project</h2>
            <p className="text-secondary-600 mb-6">Are you sure you want to delete "{project?.name}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}