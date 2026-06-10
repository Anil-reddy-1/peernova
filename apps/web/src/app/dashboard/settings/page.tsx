'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export default function SettingsPage() {
  const { userProfile, role } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(''); // simplified mock

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // update base user profile
      if (userProfile?.id) {
        await api.users.update(userProfile.id, { displayName });
      }
      // If tutor, update tutor bio via tutors endpoint
      if (role === 'tutor' && userProfile?.id) {
        await api.tutors.update(userProfile.id, { bio });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      alert('Profile updated successfully!');
    },
    onError: () => {
      alert('Failed to update profile.');
    }
  });

  return (
    <div className="animate-fade-up max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Settings</h1>
        <p className="text-surface-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 dark:border-surface-800">
        <button
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'profile' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
          {activeTab === 'profile' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-500 rounded-t-full" />}
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'preferences' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
          {activeTab === 'preferences' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-500 rounded-t-full" />}
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === 'security' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}
          onClick={() => setActiveTab('security')}
        >
          Security
          {activeTab === 'security' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-500 rounded-t-full" />}
        </button>
      </div>

      {/* Content */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Public Profile</h2>
            
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-3xl font-bold text-primary-700 dark:text-primary-300">
                {userProfile?.displayName?.charAt(0) || 'U'}
              </div>
              <button className="px-4 py-2 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-xl font-medium transition-colors">
                Change Avatar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Email Address</label>
                <input type="email" defaultValue={userProfile?.email || ''} disabled className="w-full px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-100 dark:bg-surface-800 text-surface-500 cursor-not-allowed outline-none" />
              </div>
              {role === 'tutor' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Bio</label>
                  <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Tell students about yourself..." />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
              <button 
                onClick={() => updateProfileMutation.mutate()} 
                disabled={updateProfileMutation.isPending}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Notifications</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                <div>
                  <p className="font-medium text-surface-900 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-surface-500">Receive emails about new messages and session updates.</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                <div>
                  <p className="font-medium text-surface-900 dark:text-white">Browser Notifications</p>
                  <p className="text-sm text-surface-500">Get push notifications when you are active on the site.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                <div>
                  <p className="font-medium text-surface-900 dark:text-white">Marketing Emails</p>
                  <p className="text-sm text-surface-500">Receive tips, newsletters, and promotional content.</p>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
              <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors">
                Update Preferences
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Security Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full max-w-md px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full max-w-md px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>

            <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
              <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors">
                Change Password
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-error/20">
              <h3 className="text-error font-semibold mb-2">Danger Zone</h3>
              <p className="text-sm text-surface-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
              <button className="px-4 py-2 border border-error text-error hover:bg-error hover:text-white rounded-xl font-medium transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
