import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { sprintApi } from '../services/api';
import toast from 'react-hot-toast';

interface SprintCreateModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (sprint: any) => void;
}

export default function SprintCreateModal({ projectId, onClose, onCreated }: SprintCreateModalProps) {
  const today = new Date();
  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 14);

  const toLocalDatetime = (d: Date) => {
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    name: '',
    goal: '',
    startDate: toLocalDatetime(today),
    endDate: toLocalDatetime(twoWeeks),
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        goal: form.goal || undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      const res = await sprintApi.create(projectId, payload);
      toast.success('Sprint created successfully');
      onCreated(res.data.data);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to create sprint';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">Create Sprint</h2>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input"
              placeholder="Sprint name"
              autoFocus
              disabled={saving}
            />
          </div>

          <div>
            <label className="label">Goal</label>
            <textarea
              value={form.goal}
              onChange={(e) => handleChange('goal', e.target.value)}
              className="input"
              rows={2}
              placeholder="Sprint goal (optional)"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="input"
                disabled={saving}
              />
            </div>
            <div>
              <label className="label">End Date <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="input"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
