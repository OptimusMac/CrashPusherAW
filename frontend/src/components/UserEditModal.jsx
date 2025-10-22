import React, { useState } from 'react';

export default function UserEditModal({ user, onSave, onClose, currentUserId }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    password: "",
    roles: user?.roles || ["USER"],
    enabled: user?.enabled ?? true
  });
  const [loading, setLoading] = useState(false);

  const isCurrentUser = user?.id === currentUserId;
  const canChangeRole = !isCurrentUser;
  const isChangingPassword = formData.password && formData.password.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(user?.id, formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/95 rounded-xl w-full max-w-md border border-gray-700/50 backdrop-blur-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
            Edit User {isCurrentUser && "(You)"}
          </h3>
          
          {isCurrentUser && (
            <div className="mb-4 space-y-3">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-300 text-sm">
                  <span>⚠️ You cannot change your own role</span>
                </div>
              </div>
              
              {isChangingPassword && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-300 text-sm">
                    <span>🔒 Changing password will log you out</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-gray-500 text-xs">(leave empty to keep current)</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 text-sm sm:text-base"
                placeholder="Enter new password (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                value={formData.roles[0]}
                onChange={(e) => setFormData({...formData, roles: [e.target.value]})}
                disabled={!canChangeRole}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 text-sm sm:text-base disabled:opacity-50"
              >
                <option value="USER">User</option>
                <option value="CODER">Coder</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                disabled={isCurrentUser}
                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500/50 disabled:opacity-50"
                id="enabled"
              />
              <label htmlFor="enabled" className="ml-3 text-sm text-gray-300">
                Account Enabled
              </label>
            </div>

            <div className="flex gap-3 pt-4 flex-col sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2.5 rounded-lg transition-colors border border-blue-500/30 hover:border-blue-500/50 font-medium disabled:opacity-50 text-sm sm:text-base"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 py-2.5 rounded-lg transition-colors border border-gray-600/30 hover:border-gray-600/50 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}