import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, ClipboardList, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { projectApi, issueApi, sprintApi, userApi } from '../services/api';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const statCards = [
  { name: 'Active Projects', icon: Briefcase, color: 'bg-blue-500', href: '/projects' },
  { name: 'Open Issues', icon: ClipboardList, color: 'bg-green-500', href: '/projects' },
  { name: 'Active Sprints', icon: Calendar, color: 'bg-purple-500', href: '/projects' },
  { name: 'Team Members', icon: Users, color: 'bg-orange-500', href: '/team' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    openIssues: 0,
    activeSprints: 0,
    teamMembers: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, issuesRes, sprintsRes, usersRes] = await Promise.all([
          projectApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          issueApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc', status: 'IN_PROGRESS' }),
          sprintApi.list({ limit: 5, sortBy: 'startDate', sortOrder: 'desc', status: 'active' }),
          userApi.list({ limit: 1 }),
        ]);

        setStats({
          projects: projectsRes.data.meta?.totalItems || 0,
          openIssues: issuesRes.data.meta?.totalItems || 0,
          activeSprints: sprintsRes.data.meta?.totalItems || 0,
          teamMembers: usersRes.data.meta?.totalItems || 0,
        });

        setRecentProjects(projectsRes.data.data);
        setRecentIssues(issuesRes.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatValue = (name) => {
    switch (name) {
      case 'Active Projects': return stats.projects;
      case 'Open Issues': return stats.openIssues;
      case 'Active Sprints': return stats.activeSprints;
      case 'Team Members': return stats.teamMembers;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-secondary-600">Here's what's happening in your projects today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-blue-100 text-blue-800">
            {user?.tenant?.name || 'No Tenant'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <a key={stat.name} href={stat.href} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                <p className="text-3xl font-bold text-secondary-900 mt-1">
                  {getStatValue(stat.name)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </a>
))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Recent Projects</h2>
            <a href="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </a>
          </div>
          <div className="divide-y divide-secondary-200">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto"></div>
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="p-6 text-center text-secondary-500">
                No projects yet. <a href="/projects" className="text-primary-600">Create your first project</a>
              </div>
            ) : (
              recentProjects.map((project) => (
                <div key={project.id} className="p-4 flex items-center justify-between hover:bg-secondary-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{project.name}</p>
                      <p className="text-sm text-secondary-500">{project.key}</p>
                    </div>
                  </div>
                  <span className={`badge ${getProjectStatusBadgeColor(project.visibility)}`}>
                    {project.visibility}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Recent Issues</h2>
            <a href="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </a>
          </div>
          <div className="divide-y divide-secondary-200">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto"></div>
              </div>
            ) : recentIssues.length === 0 ? (
              <div className="p-6 text-center text-secondary-500">
                No issues in progress
              </div>
            ) : (
              recentIssues.map((issue) => (
                <div key={issue.id} className="p-4 flex items-center justify-between hover:bg-secondary-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{issue.title}</p>
                      <p className="text-sm text-secondary-500">{issue.key} â€¢ {issue.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${getIssueStatusBadgeColor(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className="text-sm font-medium text-secondary-900">
                      {issue.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <a href="/projects" className="card p-6 hover:shadow-md transition-shadow">
          <Briefcase className="w-8 h-8 text-primary-600 mb-2" />
          <h3 className="font-semibold text-secondary-900">Create Project</h3>
          <p className="text-sm text-secondary-500 mt-1">Start a new project</p>
        </a>
        <a href="/projects" className="card p-6 hover:shadow-md transition-shadow">
          <ClipboardList className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-secondary-900">View Issues</h3>
          <p className="text-sm text-secondary-500 mt-1">Browse and manage issues</p>
        </a>
        <a href="/projects" className="card p-6 hover:shadow-md transition-shadow">
          <Calendar className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold text-secondary-900">Active Sprints</h3>
          <p className="text-sm text-secondary-500 mt-1">Manage sprint planning</p>
        </a>
        <a href="/team" className="card p-6 hover:shadow-md transition-shadow">
          <Users className="w-8 h-8 text-orange-600 mb-2" />
          <h3 className="font-semibold text-secondary-900">Team Members</h3>
          <p className="text-sm text-secondary-500 mt-1">Manage your team</p>
        </a>
      </div>
    </div>
  );
}

function getProjectStatusBadgeColor(status) {
  switch (status) {
    case 'PUBLIC': return 'badge-primary';
    case 'TEAM': return 'badge-success';
    case 'PRIVATE': return 'badge-secondary';
    default: return 'badge-secondary';
  }
}

function getIssueStatusBadgeColor(status) {
  switch (status) {
    case 'DONE': return 'badge-success';
    case 'IN_PROGRESS': return 'badge-primary';
    case 'IN_REVIEW': return 'badge-warning';
    case 'TODO': return 'badge-secondary';
    case 'BACKLOG': return 'badge-secondary';
    case 'CANCELLED': return 'badge-danger';
    default: return 'badge-secondary';
  }
}

function getStatValue(name) {
  // This would come from the stats state in a real implementation
  return 0;
}




