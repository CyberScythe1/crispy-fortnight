import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Camera, Save, Shield, Bell, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
}

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Mail },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        avatar: user.avatar || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      if (user.avatar) setAvatarPreview(user.avatar);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, you'd call an API to update the profile
      await updateUser({ firstName: formData.firstName, lastName: formData.lastName });
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, you'd call an API to update the email
      await updateUser({ email: formData.email });
      toast.success('Account updated');
    } catch (error) {
      toast.error('Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // In a real app, you'd call an API to change the password
      toast.success('Password changed');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Profile</h1>
        <p className="text-secondary-500">Manage your personal settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-48 flex-shrink-0">
          <div className="card">
            <div className="p-4 border-b border-secondary-200">
              <h2 className="font-semibold text-secondary-900">Settings</h2>
            </div>
            <nav className="p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-600' : 'text-secondary-400'}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="card">
            {activeTab === 'profile' && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-secondary-900">Profile Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-medium text-primary-700 text-3xl">{formData.firstName?.[0] || '?'}{formData.lastName?.[0] || ''}</span>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors cursor-pointer">
                        <Camera className="w-5 h-5" />
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">Change your avatar</h3>
                      <p className="text-secondary-500 text-sm">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-secondary-900">Account Settings</h2>
                <form onSubmit={handleSaveAccount} className="space-y-6 max-w-2xl">
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Current Email</label>
                    <p className="text-secondary-500">{formData.email}</p>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-secondary-900">Security</h2>
                <div className="space-y-6 max-w-2xl">
                  <div className="card p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Two-Factor Authentication</h3>
                    <p className="text-secondary-600 mb-4">Add an extra layer of security to your account.</p>
                    <button className="btn-primary">Enable 2FA</button>
                  </div>
                  <div className="card p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                      <div>
                        <label className="label">Current Password</label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">New Password</label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="input"
                          required
                          minLength={8}
                        />
                      </div>
                      <div>
                        <label className="label">Confirm New Password</label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="input"
                          required
                        />
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>
                  </div>
                  <div className="card p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">API Tokens</h3>
                    <p className="text-secondary-600 mb-4">Manage your personal API tokens for integrations.</p>
                    <button className="btn-secondary">Manage Tokens</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    'Issue assigned to me',
                    'Issue status changed',
                    'Issue commented on',
                    'Mentioned in comment',
                    'Sprint started/ended',
                    'Project updates',
                    'Weekly digest email',
                  ].map((pref) => (
                    <div key={pref} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <span className="text-secondary-700">{pref}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}