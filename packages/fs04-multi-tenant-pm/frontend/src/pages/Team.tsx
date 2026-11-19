import { useState, useEffect } from 'react';
import { Users, Search, Mail } from 'lucide-react';
import { userApi } from '../services/api';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await userApi.list({ limit: 100, sortBy: 'createdAt', sortOrder: 'asc' });
        setMembers(res.data.data);
      } catch (error) {
        toast.error('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const filtered = members.filter((m) =>
    !search ||
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Team</h1>
          <p className="text-secondary-600">People in your organization</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-64"
          />
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-secondary-200 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-secondary-900">Members ({members.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-secondary-500">No team members found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="p-4 text-left text-sm font-medium text-secondary-600">Member</th>
                  <th className="p-4 text-left text-sm font-medium text-secondary-600">Email</th>
                  <th className="p-4 text-left text-sm font-medium text-secondary-600">Role</th>
                  <th className="p-4 text-left text-sm font-medium text-secondary-600">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-secondary-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-medium text-primary-700">{member.firstName[0]}{member.lastName[0]}</span>
                          )}
                        </div>
                        <p className="font-medium text-secondary-900">{member.firstName} {member.lastName}</p>
                      </div>
                    </td>
                    <td className="p-4 text-secondary-500">
                      <span className="flex items-center gap-2"><Mail className="w-4 h-4" />{member.email}</span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${member.role === 'OWNER' ? 'badge-danger' : member.role === 'ADMIN' ? 'badge-warning' : 'badge-secondary'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${member.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-secondary-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
