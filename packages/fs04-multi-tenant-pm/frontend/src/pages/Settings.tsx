import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Bell, Key, Trash2, Save, Users, CheckCircle, X, MoreHorizontal, MoreVertical } from 'lucide-react';
import { projectApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
}

const tabs = [
  { id: 'general', label: 'General', icon: User },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Key },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
];

export default function Settings() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    visibility: 'TEAM',
  });

  const fetchData = async () => {
    if (!projectId) return;
    try {
      const [projectRes, membersRes] = await Promise.all([
        projectApi.get(projectId),
        userApi.list({ limit: 100 }),
      ]);
      setProject(projectRes.data.data);
      setMembers(membersRes.data.data);
      setFormData({
        name: projectRes.data.data.name,
        key: projectRes.data.data.key,
        description: projectRes.data.data.description,
        visibility: projectRes.data.data.visibility,
      });
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      await projectApi.update(projectId, formData);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

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

  const isOwner = user?.role === 'OWNER';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
          <p className="text-secondary-500">Manage settings for {project.name}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-48 flex-shrink-0">
          <div className="card">
            <div className="p-4 border-b border-secondary-200">
              <h2 className="font-semibold text-secondary-900">Settings</h2>
            </div>
            <nav className="p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  }`}
                  disabled={tab.id === 'danger' && !isOwner}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-600' : 'text-secondary-400'}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="card">
            {activeTab === 'general' && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-secondary-900">General Settings</h2>
                <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                  <div>
                    <label className="label">Project Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Project Key</label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                      className="input font-mono"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="label">Visibility</label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                      className="input"
                    >
                      <option value="TEAM">Team - Visible to team members</option>
                      <option value="PRIVATE">Private - Visible only to project members</option>
                      <option value="PUBLIC">Public - Visible to everyone in tenant</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'members' && (
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
                      {members.map((member) => (
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
                          <td className="p-4 text-right">
                            <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors" title="Edit role">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-6">Permissions</h2>
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Role Permissions</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-secondary-200">
                            <th className="p-4 text-left text-sm font-medium text-secondary-600">Permission</th>
                            <th className="p-4 text-center text-sm font-medium text-secondary-600">Owner</th>
                            <th className="p-4 text-center text-sm font-medium text-secondary-600">Admin</th>
                            <th className="p-4 text-center text-sm font-medium text-secondary-600">Member</th>
                            <th className="p-4 text-center text-sm font-medium text-secondary-600">Viewer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            'View Project',
                            'Create Issues',
                            'Edit Issues',
                            'Delete Issues',
                            'Manage Sprints',
                            'Manage Members',
                            'Manage Settings',
                            'Delete Project',
                          ].map((perm) => (
                            <tr key={perm} className="border-b border-secondary-100">
                              <td className="p-4 font-medium text-secondary-900">{perm}</td>
                              <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                              <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                              <td className="p-4 text-center">{perm === 'Manage Members' || perm === 'Manage Settings' || perm === 'Delete Project' ? <X className="w-5 h-5 text-red-500 mx-auto" /> : <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />}</td>
                              <td className="p-4 text-center">{['Create Issues', 'Edit Issues', 'Manage Sprints', 'Manage Members', 'Manage Settings', 'Delete Project'].includes(perm) ? <X className="w-5 h-5 text-red-500 mx-auto" /> : <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    'Issue assigned to me',
                    'Issue status changed',
                    'Issue commented on',
                    'Mentioned in comment',
                    'Sprint started/ended',
                    'Project updates',
                  ].map((pref) => (
                    <div key={pref} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <span className="text-secondary-700">{pref}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-6">Security Settings</h2>
                <div className="space-y-6 max-w-2xl">
                  <div className="card p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Two-Factor Authentication</h3>
                    <p className="text-secondary-600 mb-4">Add an extra layer of security to your account.</p>
                    <button className="btn-primary">Enable 2FA</button>
                  </div>
                  <div className="card p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Password</h3>
                    <p className="text-secondary-600 mb-4">Change your password.</p>
                    <button className="btn-secondary">Change Password</button>
                  </div>
                  <div className="card p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">API Tokens</h3>
                    <p className="text-secondary-600 mb-4">Manage your personal API tokens.</p>
                    <button className="btn-secondary">Manage Tokens</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-6">Danger Zone</h2>
                <div className="card p-6 border-red-200 bg-red-50">
                  <h3 className="font-medium text-red-900 mb-2">Delete Project</h3>
                  <p className="text-red-700 mb-4">Once deleted, this project and all its data (issues, sprints, members, etc.) cannot be recovered. This action is permanent.</p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-danger flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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