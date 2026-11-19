import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Calendar, ArrowRight } from 'lucide-react';
import { documentApi } from '../services/api';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  title: string;
  type: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await documentApi.list({ limit: 100, sortBy: 'updatedAt', sortOrder: 'desc' });
        setDocuments(res.data.data);
      } catch (error) {
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const filtered = documents.filter((doc) =>
    !search || doc.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Documents</h1>
          <p className="text-secondary-600">Browse documents across your workspaces</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No documents yet</h3>
          <p className="text-secondary-500 mb-6">Create documents from any workspace to see them here</p>
          <Link to="/workspaces" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Go to Workspaces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <Link key={doc.id} to={`/workspaces/${doc.workspaceId}`} className="card p-6 hover:shadow-md transition-shadow group block">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-secondary-900 truncate">{doc.title}</h3>
                  <p className="text-sm text-secondary-500">{doc.type}</p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-secondary-500">
                <Calendar className="w-4 h-4" />
                Updated {new Date(doc.updatedAt).toLocaleDateString()}
              </p>
              <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
                Open document <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
