import React from 'react';

export default function DeleteConfirmationModal({ user, onConfirm, onCancel, loading, currentUserId }) {
  const isCurrentUser = user?.id === currentUserId;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/95 rounded-xl w-full max-w-md border border-red-500/30 backdrop-blur-lg">
        <div className="p-4 sm:p-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
              <span className="text-red-400 text-lg sm:text-xl">⚠️</span>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white text-center mb-2">
            {isCurrentUser ? "Delete Your Account" : "Delete User"}
          </h3>
          
          {isCurrentUser ? (
            <>
              <p className="text-gray-300 text-center mb-2 text-sm sm:text-base">
                Are you sure you want to delete your own account?
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <div className="text-red-300 font-semibold text-center text-base sm:text-lg">
                  {user?.username} (You)
                </div>
                <div className="text-red-400 text-xs sm:text-sm text-center">
                  ID: {user?.id}
                </div>
              </div>
              <p className="text-red-400 text-xs sm:text-sm text-center mb-6">
                This will permanently delete your account and log you out immediately.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-300 text-center mb-2 text-sm sm:text-base">
                Are you sure you want to delete user
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <div className="text-red-300 font-semibold text-center text-base sm:text-lg">
                  {user?.username}
                </div>
                <div className="text-red-400 text-xs sm:text-sm text-center">
                  ID: {user?.id}
                </div>
              </div>
              <p className="text-red-400 text-xs sm:text-sm text-center mb-6">
                This action cannot be undone.
              </p>
            </>
          )}

          <div className="flex gap-3 flex-col sm:flex-row">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 py-2.5 rounded-lg transition-colors border border-gray-600/30 hover:border-gray-600/50 font-medium disabled:opacity-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(user)}
              disabled={loading}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2.5 rounded-lg transition-colors border border-red-500/30 hover:border-red-500/50 font-medium disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Deleting...' : isCurrentUser ? 'Delete My Account' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}