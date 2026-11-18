import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  color: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance'>('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    color: '#6366f1',
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
  });

  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        color: user.color || '#6366f1',
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: true,
      });
    }
    setLoading(false);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Save },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-600">Manage your account settings and preferences</p>
      </div>

      <div className="card">
        <div className="border-b border-secondary-200">
          <nav className="flex gap-1 p-1" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold`} style={{ backgroundColor: formData.color }}>
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </div>
                <div>
                  <label className="label">Avatar Color</label>
                  <input type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="w-16 h-10 rounded-lg border border-secondary-200 cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input pl-10" disabled />
                </div>
                <p className="mt-1 text-sm text-secondary-500">Email cannot be changed</p>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Email Notifications</p>
                  <p className="text-sm text-secondary-500">Receive email updates about workspace activity</p>
                </div>
                <button
                  onClick={() => setFormData({...formData, emailNotifications: !formData.emailNotifications})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.emailNotifications ? 'bg-primary-600' : 'bg-secondary-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Push Notifications</p>
                  <p className="text-sm text-secondary-500">Receive browser push notifications</p>
                </div>
                <button
                  onClick={() => setFormData({...formData, pushNotifications: !formData.pushNotifications})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.pushNotifications ? 'bg-primary-600' : 'bg-secondary-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Weekly Digest</p>
                  <p className="text-sm text-secondary-500">Receive a weekly summary of activity</p>
                </div>
                <button
                  onClick={() => setFormData({...formData, weeklyDigest: !formData.weeklyDigest})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.weeklyDigest ? 'bg-primary-600' : 'bg-secondary-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.weeklyDigest ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <p className="font-medium text-secondary-900 mb-4">Theme Color</p>
                <div className="flex flex-wrap gap-3">
                  {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({...formData, color})}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${formData.color === color ? 'border-primary-600 scale-110' : 'border-transparent hover:border-secondary-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Dark Mode</p>
                  <p className="text-sm text-secondary-500">Use dark theme (system preference)</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-secondary-300 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}