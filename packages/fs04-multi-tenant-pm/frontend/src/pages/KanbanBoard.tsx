import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MoreHorizontal, Users, Calendar, ClipboardList, ChevronDown, Search } from 'lucide-react';
import { issueApi, projectApi, userApi, sprintApi } from '../services/api';
import toast from 'react-hot-toast';

interface Issue {
  id: string;
  key: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  sprintId: string | null;
  projectId: string;
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

const statusColumns = [
  { id: 'BACKLOG', label: 'Backlog', color: 'bg-gray-100' },
  { id: 'TODO', label: 'To Do', color: 'bg-blue-100' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-purple-100' },
  { id: 'DONE', label: 'Done', color: 'bg-green-100' },
];

export default function KanbanBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    if (!projectId) return;
    try {
      const [projectRes, issuesRes, membersRes] = await Promise.all([
        projectApi.get(projectId),
        issueApi.list({ projectId, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
        userApi.list({ limit: 50 }),
      ]);
      setProject(projectRes.data.data);
      setIssues(issuesRes.data.data);
      setMembers(membersRes.data.data);
    } catch (error) {
      toast.error('Failed to load board');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

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

  const filteredIssues = issues.filter((issue) =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAssigneeName = (assigneeId: string | null) => {
    if (!assigneeId) return 'Unassigned';
    const member = members.find((m) => m.id === assigneeId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/project/${projectId}`)} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{project.name} - Kanban Board</h1>
          <p className="text-secondary-500">Key: {project.key}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => {}}>
            <Plus className="w-4 h-4" />
            Create Issue
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => {
          const columnIssues = filteredIssues.filter((issue) => issue.status === column.id);
          return (
            <div key={column.id} className="min-w-[300px] max-w-[300px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                  {column.label}
                  <span className={`badge ${column.color === 'bg-gray-100' ? 'badge-secondary' : column.color === 'bg-blue-100' ? 'badge-primary' : column.color === 'bg-yellow-100' ? 'badge-warning' : column.color === 'bg-purple-100' ? 'badge-purple' : 'badge-success'}`}>
                    {columnIssues.length}
                  </span>
                </h3>
              </div>
              <div
                className={`${column.color} rounded-xl p-3 min-h-[400px] space-y-3`}
                onDragOver={(e) => e.preventDefault()}
              >
                {columnIssues.length === 0 ? (
                  <div className="text-center text-secondary-400 py-8 text-sm">Drop issues here</div>
                ) : (
                  columnIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow border border-secondary-100"
                      draggable
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-primary-600">{issue.key}</span>
                        <button className="p-1 text-secondary-400 hover:text-secondary-600 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="mt-2 font-medium text-secondary-900 text-sm line-clamp-2">{issue.title}</h4>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`badge ${issue.type === 'BUG' ? 'badge-danger' : issue.type === 'STORY' ? 'badge-primary' : 'badge-secondary'}`}>
                          {issue.type}
                        </span>
                        <span className={`badge ${issue.priority === 'HIGH' || issue.priority === 'CRITICAL' ? 'badge-danger' : issue.priority === 'MEDIUM' ? 'badge-warning' : 'badge-secondary'}`}>
                          {issue.priority}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {issue.assigneeId && (
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-700">
                              {members.find((m) => m.id === issue.assigneeId)?.firstName?.[0] || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}