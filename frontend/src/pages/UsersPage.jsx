import React, { useEffect, useState, useCallback } from "react";
import { fetchUsers, updateUser, deleteUser } from "../api/userManagementApi";
import SearchBar from "../components/SearchBar";
import { getToken, removeToken, forceTokenRefresh } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { getUsernameFromToken, getRolesFromToken } from "../utils/jwtUtils";

function UserRow({ user, onEdit, onDelete, currentUserId }) {
  const getRoleBadge = (roles) => {
    if (roles?.includes("ADMIN")) {
      return (
        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30 shadow-lg shadow-purple-500/10">
          ADMIN
        </span>
      );
    }
    if (roles?.includes("CODER")) {
      return (
        <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded text-xs border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
          CODER
        </span>
      );
    }
    return (
      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs border border-blue-500/30 shadow-lg shadow-blue-500/10">
        USER
      </span>
    );
  };

  const getStatusBadge = (enabled) => {
    return enabled ? (
      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
        ACTIVE
      </span>
    ) : (
      <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs border border-gray-500/30">
        DISABLED
      </span>
    );
  };

  const isCurrentUser = user.id === currentUserId;

  return (
    <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg mb-3 hover:bg-gray-700/50 transition-colors border border-gray-700/50">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="font-semibold text-white text-lg flex items-center gap-2">
            {user.username}
            {isCurrentUser && (
              <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-xs border border-amber-500/30 shadow-lg shadow-amber-500/10 text-xs">
                YOU
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {getRoleBadge(user.roles)}
            {getStatusBadge(user.enabled)}
          </div>
        </div>
        <div className="text-sm text-gray-400">
          ID: {user.id}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(user)}
          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded-lg text-sm transition-all duration-300 border border-blue-500/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(user)}
          disabled={isCurrentUser}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm transition-all duration-300 border border-red-500/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 disabled:bg-gray-500/10 disabled:text-gray-500 disabled:border-gray-500/20 disabled:cursor-not-allowed"
          title={isCurrentUser ? "You cannot delete your own account" : ""}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function UserEditModal({ user, onSave, onClose, currentUserId }) {
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800/90 rounded-xl p-6 w-96 border border-gray-700/50 backdrop-blur-lg">
        <h3 className="text-xl font-bold text-white mb-4">
          Edit User {isCurrentUser && "(You)"}
        </h3>
        
        {isCurrentUser && (
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-300 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>You cannot change your own role</span>
              </div>
            </div>
            
            {isChangingPassword && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Changing your password will log you out for security</span>
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
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
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
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
              placeholder="Enter new password (optional)"
            />
            {isCurrentUser && isChangingPassword && (
              <p className="text-blue-400 text-xs mt-1">
                You will be logged out after changing your password
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.roles[0]}
              onChange={(e) => setFormData({...formData, roles: [e.target.value]})}
              disabled={!canChangeRole}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="USER">User</option>
              <option value="CODER">Coder</option>
              <option value="ADMIN">Admin</option>
            </select>
            {!canChangeRole && (
              <p className="text-yellow-400 text-xs mt-1">
                You cannot change your own role for security reasons
              </p>
            )}
          </div>

          <div className="flex items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
              disabled={isCurrentUser}
              className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              id="enabled"
            />
            <label htmlFor="enabled" className="ml-3 text-sm text-gray-300">
              Account Enabled
              {isCurrentUser && (
                <span className="text-yellow-400 text-xs ml-1">(Cannot disable your own account)</span>
              )}
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2.5 rounded-lg transition-colors border border-blue-500/30 hover:border-blue-500/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 py-2.5 rounded-lg transition-colors border border-gray-600/30 hover:border-gray-600/50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ user, onConfirm, onCancel, loading, currentUserId }) {
  const isCurrentUser = user?.id === currentUserId;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800/90 rounded-xl p-6 w-96 border border-red-500/30 backdrop-blur-lg">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white text-center mb-2">
          {isCurrentUser ? "Delete Your Account" : "Delete User"}
        </h3>
        
        {isCurrentUser ? (
          <>
            <p className="text-gray-300 text-center mb-2">
              Are you sure you want to delete your own account?
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <div className="text-red-300 font-semibold text-center text-lg">
                {user?.username} (You)
              </div>
              <div className="text-red-400 text-sm text-center">
                ID: {user?.id}
              </div>
            </div>
            <p className="text-red-400 text-sm text-center mb-6">
              ⚠️ This will permanently delete your account and log you out immediately.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-300 text-center mb-2">
              Are you sure you want to delete user
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <div className="text-red-300 font-semibold text-center text-lg">
                {user?.username}
              </div>
              <div className="text-red-400 text-sm text-center">
                ID: {user?.id}
              </div>
            </div>
            <p className="text-red-400 text-sm text-center mb-6">
              ⚠️ This action cannot be undone and will permanently delete the user account.
            </p>
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 py-2.5 rounded-lg transition-colors border border-gray-600/30 hover:border-gray-600/50 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(user)}
            disabled={loading}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2.5 rounded-lg transition-colors border border-red-500/30 hover:border-red-500/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              isCurrentUser ? "Delete My Account" : "Delete User"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const { refreshUser, user: currentUser, loading: authLoading } = useAuth();
  
  const [currentUsername, setCurrentUsername] = useState('');

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const username = getUsernameFromToken(token);
        setCurrentUsername(username);
      } catch (error) {
        console.error('Error getting username from token:', error);
      }
    }
  }, []);

  const loadUsers = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const data = await fetchUsers(q);
      setUsers(data);
    } catch (e) {
      console.error("Failed to load users:", e);
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadUsers(query);
  }, [query, loadUsers]);

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleDeleteClick = (user) => {
    setDeletingUser(user);
  };

  const handleDeleteConfirm = async (user) => {
    setDeleteLoading(true);
    try {
      await deleteUser(user.id);
      
      const isSelfDelete = user.username === currentUsername;
      
      if (isSelfDelete) {
        showMessage('success', 'Your account has been deleted. Redirecting to login...');
        removeToken();
        setTimeout(() => {
          window.location.href = '/auth?message=self_deleted';
        }, 2000);
      } else {
        showMessage('success', `User "${user.username}" deleted successfully`);
        await loadUsers(query);
      }
      
      setDeletingUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      showMessage('error', error.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingUser(null);
  };

  const handleSave = async (userId, userData) => {
    try {
      console.log('💾 Starting user update...', { userId, userData, currentUser });
      
      // Проверяем, не пытается ли пользователь изменить свою роль
      const isSelfUpdate = userId === currentUser?.id;
      const isChangingRole = userData.roles[0] !== currentUser?.roles?.[0];
      const isChangingPassword = userData.password && userData.password.trim() !== '';
      
      if (isSelfUpdate && isChangingRole) {
        showMessage('error', 'You cannot change your own role for security reasons');
        return;
      }
      
      await updateUser(userId, userData);
      showMessage('success', 'User updated successfully');
      
      if (isSelfUpdate) {
        console.log('🔄 Self-update detected!');
        
        if (isChangingPassword) {
          console.log('🔐 Password changed - forcing logout');
          
          showMessage('warning', 'Password changed successfully. You will be logged out for security reasons.');
          
          // Ждем немного и разлогиниваем
          setTimeout(() => {
            removeToken();
            window.location.href = '/auth?message=password_changed';
          }, 2000);
          
        } else {
          // Если пароль не менялся, просто обновляем данные пользователя
          console.log('🔄 Refreshing user data...');
          refreshUser();
          
          showMessage('success', 'User updated successfully. Your data has been refreshed.');
        }
      }
      
      // Обновляем список пользователей
      console.log('🔄 Reloading users list...');
      await loadUsers(query);
      setEditingUser(null);
      
    } catch (error) {
      console.error("❌ Failed to save user:", error);
      showMessage('error', error.response?.data?.error || 'Failed to save user');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-400 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          Loading user data...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Message Alert */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-300 border-green-500/30' 
            : message.type === 'warning'
            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            : 'bg-red-500/20 text-red-300 border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-gray-400">Manage system users and their permissions</p>
        {currentUser && (
          <div className="mt-2 text-sm">
            <span className="text-gray-400">Logged in as: </span>
            <span className="text-blue-300 font-semibold">{currentUser.username}</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-purple-300">
              Roles: {currentUser.roles?.join(', ')}
            </span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-green-300">
              ID: {currentUser.id || 'N/A'}
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar 
          onSearch={setQuery} 
          placeholder="Search users by username..." 
        />
      </div>

      {/* Users List */}
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <div className="text-4xl mb-3">👥</div>
            {query ? 'No users found matching your search' : 'No users found'}
          </div>
        ) : (
          <div>
            <div className="text-sm text-gray-400 mb-4 px-1">
              Found {users.length} user{users.length !== 1 ? 's' : ''}
              {query && ` for "${query}"`}
            </div>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onSave={handleSave}
          onClose={() => setEditingUser(null)}
          currentUserId={currentUser?.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <DeleteConfirmationModal
          user={deletingUser}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleteLoading}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}