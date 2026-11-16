import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Trash2, Edit, FolderOpen } from 'lucide-react';
import { projectApi } from '../services/api';
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

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', key: '', description: '', visibility: 'TEAM' });

  const fetchProjects = async () => {
    try {
      const res = await projectApi.list({ search, sortBy: 'createdAt', sortOrder: 'desc' });
      setProjects(res.data.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await projectApi.create(newProject);
      toast.success('Project created!');
      setShowCreateModal(false);
      setNewProject({ name: '', key: '', description: '', visibility: 'TEAM' });
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectApi.delete(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Projects</h1>
          <p className="text-secondary-600">Manage your projects and collaborate with your team</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-secondary-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Filter className="w-5 h-5 text-secondary-400 self-center" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Project</th>
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Key</th>
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Visibility</th>
                <th className="p-4 text-left text-sm font-medium text-secondary-600">Created</th>
                <th className="p-4 text-right text-sm font-medium text-secondary-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-secondary-500">
                    No projects yet. <button onClick={() => setShowCreateModal(true)} className="text-primary-600 hover:underline">Create your first project</button>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="flex items-center gap-3 hover:text-primary-600"
                      >
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{project.name}</p>
                          <p className="text-sm text-secondary-500 truncate max-w-xs">{project.description || 'No description'}</p>
                        </div>
                      </button>
                    </td>
                    <td className="p-4 font-mono text-secondary-700">{project.key}</td>
                    <td className="p-4">
                      <span className={`badge ${project.visibility === 'PUBLIC' ? 'badge-primary' : project.visibility === 'TEAM' ? 'badge-success' : 'badge-secondary'}`}>
                        {project.visibility}
                      </span>
                    </td>
                    <td className="p-4 text-secondary-500 text-sm">{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                          title="Open"
                        >
                          <FolderOpen className="w-4 h-4 text-secondary-500" />
                        </button>
                        <button
                          onClick={() => navigate(`/projects/${project.id}/settings`)}
                          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                          title="Settings"
                        >
                          <MoreHorizontal className="w-4 h-4 text-secondary-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="input"
                  placeholder="My Awesome Project"
                  required
                />
              </div>
              <div>
                <label className="label">Project Key</label>
                <input
                  type="text"
                  value={newProject.key}
                  onChange={(e) => setNewProject({ ...newProject, key: e.target.value.toUpperCase() })}
                  className="input font-mono"
                  placeholder="PRJ"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Project description..."
                />
              </div>
              <div>
                <label className="label">Visibility</label>
                <select
                  value={newProject.visibility}
                  onChange={(e) => setNewProject({ ...newProject, visibility: e.target.value })}
                  className="input"
                >
                  <option value="TEAM">Team - Visible to team members</option>
                  <option value="PRIVATE">Private - Visible only to project members</option>
                  <option value="PUBLIC">Public - Visible to everyone in tenant</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}