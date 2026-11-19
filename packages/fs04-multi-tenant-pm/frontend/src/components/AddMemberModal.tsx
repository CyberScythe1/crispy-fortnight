import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { projectApi, userApi } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
}

interface AddMemberModalProps {
  projectId: string;
  existingMembers: Member[];
  onClose: () => void;
  onAdded: () => void;
}

export default function AddMemberModal({ projectId, existingMembers, onClose, onAdded }: AddMemberModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userApi.list({ limit: 100 });
        setUsers(res.data.data);
      } catch (error) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const existingUserIds = new Set(existingMembers.map((m) => m.userId));
  const availableUsers = users.filter((u) => !existingUserIds.has(u.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await projectApi.addMember(projectId, { userId: selectedUserId, role });
      toast.success('Member added successfully');
      onAdded();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to add member';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">Add Member</h2>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">User <span className="text-red-500">*</span></label>
            {loading ? (
              <div className="flex items-center gap-2 text-secondary-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
              </div>
            ) : availableUsers.length === 0 ? (
              <p className="text-sm text-secondary-500">All users are already members of this project.</p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="input"
                disabled={saving}
                required
              >
                <option value="">Select a user...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
              disabled={saving}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !selectedUserId}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
