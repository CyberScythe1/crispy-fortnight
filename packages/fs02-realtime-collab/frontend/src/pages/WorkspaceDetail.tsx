import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Users, Calendar, Trash2, MoreHorizontal } from 'lucide-react';
import { workspaceApi, documentApi } from '../services/api';
import toast from 'react-hot-toast';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  id: string;
  role: string;
  user: { id: string; firstName: string; lastName: string; email: string; avatar: string | null };
}

export default function WorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('DOCUMENT');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    if (!workspaceId) return;
    try {
      const [wsRes, docsRes, membersRes] = await Promise.all([
        workspaceApi.get(workspaceId),
        documentApi.listByWorkspace(workspaceId, { limit: 100, sortBy: 'updatedAt', sortOrder: 'desc' }),
        workspaceApi.getMembers(workspaceId),
      ]);
      setWorkspace(wsRes.data.data);
      setDocuments(docsRes.data.data);
      setMembers(membersRes.data.data);
    } catch (error) {
      toast.error('Failed to load workspace');
      navigate('/workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newDocTitle.trim()) return;
    setCreating(true);
    try {
      await documentApi.create(workspaceId, { title: newDocTitle.trim(), type: newDocType });
      toast.success('Document created');
      setShowCreateDoc(false);
      setNewDocTitle('');
      setNewDocType('DOCUMENT');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!workspaceId || !confirm('Delete this document?')) return;
    try {
      await documentApi.delete(workspaceId, docId);
      toast.success('Document deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!workspace) {
    return <div className="text-center py-12 text-secondary-500">Workspace not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/workspaces')} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{workspace.name}</h1>
          <p className="text-secondary-500">{workspace.slug}</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowCreateDoc(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Document
          </button>
        </div>
      </div>

      {workspace.description && (
        <div className="card p-6">
          <p className="text-secondary-700">{workspace.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Documents ({documents.length})</h2>
          </div>

          {documents.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No documents yet</h3>
              <p className="text-secondary-500 mb-6">Create your first document in this workspace</p>
              <button onClick={() => setShowCreateDoc(true)} className="btn-primary flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                New Document
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-secondary-900 truncate">{doc.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-secondary-500 mt-1">
                      <span className="badge badge-secondary">{doc.type}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-secondary-600 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members ({members.length})
            </h3>
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-secondary-400">No members</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary-700">
                        {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-xs text-secondary-500">{member.user.email}</p>
                    </div>
                    <span className={`badge ${member.role === 'OWNER' ? 'badge-danger' : member.role === 'ADMIN' ? 'badge-warning' : 'badge-secondary'}`}>
                      {member.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-secondary-600 mb-4">Workspace Info</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-secondary-500">Slug</dt>
                <dd className="font-mono font-medium text-secondary-900">{workspace.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary-500">Created</dt>
                <dd className="text-secondary-700">{new Date(workspace.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary-500">Updated</dt>
                <dd className="text-secondary-700">{new Date(workspace.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {showCreateDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h2 className="text-xl font-semibold text-secondary-900">New Document</h2>
              <button onClick={() => setShowCreateDoc(false)} className="text-secondary-400 hover:text-secondary-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDoc} className="p-6 space-y-4">
              <div>
                <label className="label">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="input"
                  placeholder="Document title"
                  autoFocus
                  disabled={creating}
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="input"
                  disabled={creating}
                >
                  <option value="DOCUMENT">Document</option>
                  <option value="CANVAS">Canvas</option>
                  <option value="SPREADSHEET">Spreadsheet</option>
                  <option value="DATABASE">Database</option>
                  <option value="KANBAN">Kanban</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateDoc(false)} className="btn-secondary" disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
