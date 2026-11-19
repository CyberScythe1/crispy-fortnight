import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FolderOpen, ArrowRight } from 'lucide-react';
import { projectApi } from '../services/api';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  visibility: string;
}

export default function ReportsOverview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectApi.list({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
        setProjects(res.data.data);
      } catch (error) {
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Reports</h1>
        <p className="text-secondary-600">Select a project to view its reports and analytics</p>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No projects yet</h3>
          <p className="text-secondary-500 mb-6">Create a project first to see its reports</p>
          <Link to="/projects" className="btn-primary inline-flex items-center gap-2">
            Go to Projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}/reports`}
              className="card p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-secondary-900 truncate">{project.name}</h3>
                  <p className="text-sm font-mono text-secondary-500">{project.key}</p>
                </div>
              </div>
              <p className="text-sm text-secondary-500 line-clamp-2 mb-4">{project.description || 'No description'}</p>
              <span className="flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
                View report <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
