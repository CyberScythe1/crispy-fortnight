import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { workspaceApi } from '../services/api';
import { Plus, FolderOpen, Users, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export default function Workspaces() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', slug: '' });

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.list({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
      setWorkspaces(res.data.data);
    } catch (error) {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workspaceApi.create(newWorkspace);
      toast.success('Workspace created');
      setShowCreateModal(false);
      setNewWorkspace({ name: '', slug: '' });
      fetchWorkspaces();
    } catch (error) {
      toast.error('Failed to create workspace');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return;
    try {
      await workspaceApi.delete(id);
      toast.success('Workspace deleted');
      fetchWorkspaces();
    } catch (error) {
      toast.error('Failed to delete workspace');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Workspaces</h1>
          <p className="text-secondary-600">Manage your collaborative workspaces</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Workspace
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No workspaces yet</h3>
          <p className="text-secondary-500 mb-6">Create your first workspace to start collaborating</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div key={ws.id} className="card p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/workspaces/${ws.id}`)}>
               <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-green-600" />
                </div>
                <button className="p-1 text-secondary-400 hover:text-secondary-600 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-secondary-900">{ws.name}</h3>
              <p className="text-sm text-secondary-500 mt-1">{ws.slug}</p>
              <div className="mt-4 flex items-center gap-2">
                <button className="btn-secondary text-sm flex-1 flex items-center justify-center gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/workspaces/${ws.id}`); }}>
                  <Users className="w-4 h-4" />
                  Members
                </button>
                <button className="btn-secondary text-sm flex-1 flex items-center justify-center gap-2" onClick={(e) => { e.stopPropagation(); }}>
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="btn-danger text-sm flex-1 flex items-center justify-center gap-2" onClick={(e) => { e.stopPropagation(); handleDelete(ws.id); }}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Create Workspace</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Workspace Name</label>
                <input type="text" value={newWorkspace.name} onChange={(e) => setNewWorkspace({...newWorkspace, name: e.target.value})} className="input" placeholder="My Workspace" required />
              </div>
              <div>
                <label className="label">Slug</label>
                <input type="text" value={newWorkspace.slug} onChange={(e) => setNewWorkspace({...newWorkspace, slug: e.target.value})} className="input" placeholder="my-workspace" required />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}