import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { issueApi } from '../services/api';
import toast from 'react-hot-toast';

interface Sprint {
  id: string;
  name: string;
}

interface IssueCreateModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (issue: any) => void;
  sprints?: Sprint[];
}

export default function IssueCreateModal({ projectId, onClose, onCreated, sprints = [] }: IssueCreateModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'TASK',
    priority: 'MEDIUM',
    sprintId: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description,
        type: form.type,
        priority: form.priority,
      };
      if (form.sprintId) payload.sprintId = form.sprintId;
      const res = await issueApi.create(projectId, payload);
      toast.success('Issue created successfully');
      onCreated(res.data.data);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to create issue';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">Create Issue</h2>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="input"
              placeholder="Issue title"
              autoFocus
              disabled={saving}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="input"
              rows={3}
              placeholder="Add more details..."
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="input"
                disabled={saving}
              >
                <option value="TASK">Task</option>
                <option value="STORY">Story</option>
                <option value="BUG">Bug</option>
                <option value="EPIC">Epic</option>
                <option value="SUBTASK">Sub-task</option>
              </select>
            </div>

            <div>
              <label className="label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="input"
                disabled={saving}
              >
                <option value="LOWEST">Lowest</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="HIGHEST">Highest</option>
              </select>
            </div>
          </div>

          {sprints.length > 0 && (
            <div>
              <label className="label">Sprint</label>
              <select
                value={form.sprintId}
                onChange={(e) => handleChange('sprintId', e.target.value)}
                className="input"
                disabled={saving}
              >
                <option value="">No sprint</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
