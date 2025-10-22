import React, { 
  useEffect, 
  useState, 
  useCallback, 
  useMemo, 
  lazy, 
  Suspense,
  memo
} from "react";
import { fetchUsers, updateUser, deleteUser } from "../api/userManagementApi";
import SearchBar from "../components/SearchBar";
import { getToken, removeToken } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { useCachedUsers } from "../hooks/useCachedUsers";

// Ленивая загрузка модальных окон
const UserEditModal = lazy(() => 
  import('../components/UserEditModal').then(module => ({
    default: module.default
  }))
);

const DeleteConfirmationModal = lazy(() => 
  import('../components/DeleteConfirmationModal').then(module => ({
    default: module.default
  }))
);

// Константы
const ROLE_BADGES = {
  ADMIN: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  CODER: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  USER: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' }
};

const STATUS_BADGES = {
  true: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  false: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
};

// Оптимизированные компоненты
const UserIcon = memo(() => <div className="text-3xl mb-2">👥</div>);
UserIcon.displayName = 'UserIcon';

const LoadingSpinner = memo(({ text = "Loading..." }) => (
  <div className="text-center text-gray-400 py-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2" />
    <span className="text-sm">{text}</span>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

const Badge = memo(({ 
  children, 
  bg, 
  text, 
  border,
  className = "" 
}) => (
  <span className={`${bg} ${text} ${border} px-2 py-1 rounded text-xs border ${className}`}>
    {children}
  </span>
));
Badge.displayName = 'Badge';

const RoleBadge = memo(({ roles }) => {
  const role = roles?.includes("ADMIN") ? "ADMIN" : 
               roles?.includes("CODER") ? "CODER" : "USER";
  const style = ROLE_BADGES[role];
  
  return (
    <Badge bg={style.bg} text={style.text} border={style.border}>
      {role}
    </Badge>
  );
});
RoleBadge.displayName = 'RoleBadge';

const StatusBadge = memo(({ enabled }) => {
  const style = STATUS_BADGES[enabled];
  const status = enabled ? "ACTIVE" : "DISABLED";
  
  return (
    <Badge bg={style.bg} text={style.text} border={style.border}>
      {status}
    </Badge>
  );
});
StatusBadge.displayName = 'StatusBadge';

// Кнопки действий (оставляем как были, но с адаптацией)
const ActionButton = memo(({ 
  onClick, 
  children, 
  variant = "primary",
  disabled = false,
  title = "",
  className = ""
}) => {
  const baseClasses = "px-3 py-2 rounded-lg text-sm transition-all duration-300 border flex-1 sm:flex-none min-w-[70px]";
  
  const variants = {
    primary: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30 hover:border-blue-500/50",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50",
    disabled: "bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed"
  };

  const buttonClass = disabled 
    ? `${baseClasses} ${variants.disabled} ${className}`
    : `${baseClasses} ${variants[variant]} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClass}
      title={title}
    >
      {children}
    </button>
  );
});
ActionButton.displayName = 'ActionButton';

// Оптимизированный компонент строки пользователя
const UserRow = memo(({ user, onEdit, onDelete, currentUserId }) => {
  const isCurrentUser = user.id === currentUserId;
  
  const handleEdit = useCallback(() => {
    onEdit(user);
  }, [onEdit, user]);

  const handleDelete = useCallback(() => {
    onDelete(user);
  }, [onDelete, user]);

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-gray-800/50 rounded-lg mb-3 hover:bg-gray-700/50 transition-colors border border-gray-700/50">
      {/* Основная информация */}
      <div className="flex-1 mb-3 sm:mb-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          {/* Имя пользователя и бейдж YOU */}
          <div className="font-semibold text-white text-base sm:text-lg flex items-center gap-2">
            <span className="truncate">{user.username}</span>
            {isCurrentUser && (
              <Badge 
                bg="bg-amber-500/20" 
                text="text-amber-300" 
                border="border-amber-500/30"
                className="flex-shrink-0"
              >
                YOU
              </Badge>
            )}
          </div>
          
          {/* Роли и статус В ОДНОМ РЯДУ */}
          <div className="flex items-center gap-2 flex-wrap">
            <RoleBadge roles={user.roles} />
            <StatusBadge enabled={user.enabled} />
          </div>
        </div>
        
        {/* ID пользователя */}
        <div className="text-xs sm:text-sm text-gray-400">
          ID: {user.id}
        </div>
      </div>
      
      {/* Кнопки действий - адаптируются по ширине */}
      <div className="flex gap-2 w-full sm:w-auto">
        <ActionButton onClick={handleEdit} variant="primary">
          Edit
        </ActionButton>
        <ActionButton 
          onClick={handleDelete} 
          variant="danger"
          disabled={isCurrentUser}
          title={isCurrentUser ? "You cannot delete your own account" : ""}
        >
          Delete
        </ActionButton>
      </div>
    </div>
  );
});
UserRow.displayName = 'UserRow';

// Компонент сообщения
const MessageAlert = memo(({ message }) => {
  if (!message.text) return null;

  const alertStyles = {
    success: 'bg-green-500/20 text-green-300 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  return (
    <div className={`mb-4 p-3 rounded-lg border ${alertStyles[message.type]}`}>
      {message.text}
    </div>
  );
});
MessageAlert.displayName = 'MessageAlert';

// Компонент заголовка
const PageHeader = memo(({ currentUser }) => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
      User Management
    </h1>
    <p className="text-gray-400 text-sm sm:text-base">
      Manage system users and their permissions
    </p>
    {currentUser && (
      <div className="mt-2 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className="text-gray-400">Logged in as: </span>
        <span className="text-blue-300 font-semibold">{currentUser.username}</span>
        <span className="hidden sm:inline text-gray-500">•</span>
        <span className="text-purple-300">
          Roles: {currentUser.roles?.join(', ')}
        </span>
        <span className="hidden sm:inline text-gray-500">•</span>
        <span className="text-green-300">
          ID: {currentUser.id || 'N/A'}
        </span>
      </div>
    )}
  </div>
));
PageHeader.displayName = 'PageHeader';

// Хук для управления состоянием сообщений
const useMessage = () => {
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    return () => clearTimeout(timer);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage({ type: '', text: '' });
  }, []);

  return { message, showMessage, clearMessage };
};

// Хук для управления пользователями
const useUsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { message, showMessage } = useMessage();

  const loadUsers = useCallback(async (searchQuery = "") => {
    setLoading(true);
    try {
      const data = await fetchUsers(searchQuery);
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // Дебаунс поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, loadUsers]);

  return {
    users,
    query,
    setQuery,
    loading,
    message,
    showMessage,
    loadUsers
  };
};

// Компонент списка пользователей
const UsersList = memo(({ 
  users, 
  loading, 
  query, 
  onEdit, 
  onDelete, 
  currentUserId 
}) => {
  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  if (users.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <UserIcon />
        {query ? 'No users found matching your search' : 'No users found'}
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-gray-400 mb-4 px-1">
        Found {users.length} user{users.length !== 1 ? 's' : ''}
        {query && ` for "${query}"`}
      </div>
      {users.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
});
UsersList.displayName = 'UsersList';

// Главный компонент
const UsersPage = () => {
  const {
    users,
    query,
    setQuery,
    loading,
    message,
    showMessage,
    loadUsers,
    invalidateCache
  } = useCachedUsers();

  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { refreshUser, user: currentUser, loading: authLoading } = useAuth();

  // Обработчики
  const handleEdit = useCallback((user) => {
    setEditingUser(user);
  }, []);

  const handleDeleteClick = useCallback((user) => {
    setDeletingUser(user);
  }, []);

  const handleDeleteConfirm = useCallback(async (user) => {
    setDeleteLoading(true);
    try {
      await deleteUser(user.id);
      
      const isSelfDelete = user.id === currentUser?.id;
      
      if (isSelfDelete) {
        showMessage('success', 'Your account has been deleted. Redirecting to login...');
        removeToken();
        setTimeout(() => {
          window.location.href = '/auth?message=self_deleted';
        }, 2000);
      } else {
        showMessage('success', `User "${user.username}" deleted successfully`);
        invalidateCache(); // Инвалидируем кэш
        await loadUsers(query);
      }
      
      setDeletingUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      showMessage('error', error.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  }, [currentUser, showMessage, loadUsers, query, invalidateCache]);

  const handleDeleteCancel = useCallback(() => {
    setDeletingUser(null);
  }, []);

  const handleSave = useCallback(async (userId, userData) => {
    try {
      const isSelfUpdate = userId === currentUser?.id;
      const isChangingRole = userData.roles[0] !== currentUser?.roles?.[0];
      const isChangingPassword = userData.password && userData.password.trim() !== '';
      
      if (isSelfUpdate && isChangingRole) {
        showMessage('error', 'You cannot change your own role for security reasons');
        return;
      }
      
      await updateUser(userId, userData);
      showMessage('success', 'User updated successfully');
      
      if (isSelfUpdate && isChangingPassword) {
        showMessage('warning', 'Password changed successfully. You will be logged out for security reasons.');
        setTimeout(() => {
          removeToken();
          window.location.href = '/auth?message=password_changed';
        }, 2000);
      } else if (isSelfUpdate) {
        refreshUser();
      }
      
      invalidateCache(); // Инвалидируем кэш после изменений
      await loadUsers(query);
      setEditingUser(null);
      
    } catch (error) {
      console.error("Failed to save user:", error);
      showMessage('error', error.response?.data?.error || 'Failed to save user');
    }
  }, [currentUser, showMessage, refreshUser, loadUsers, query, invalidateCache]);

  const handleCloseEdit = useCallback(() => {
    setEditingUser(null);
  }, []);

  // Мемоизированные пропсы
  const usersListProps = useMemo(() => ({
    users,
    loading,
    query,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    currentUserId: currentUser?.id
  }), [users, loading, query, handleEdit, handleDeleteClick, currentUser]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <LoadingSpinner text="Loading user data..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <MessageAlert message={message} />
      
      <PageHeader currentUser={currentUser} />

      <div className="mb-6">
        <SearchBar 
          onSearch={setQuery} 
          placeholder="Search users by username..." 
        />
      </div>

      <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/30">
        <UsersList {...usersListProps} />
      </div>

      <Suspense 
        fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <LoadingSpinner text="Loading modal..." />
          </div>
        }
      >
        {editingUser && (
          <UserEditModal
            user={editingUser}
            onSave={handleSave}
            onClose={handleCloseEdit}
            currentUserId={currentUser?.id}
          />
        )}
        
        {deletingUser && (
          <DeleteConfirmationModal
            user={deletingUser}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            loading={deleteLoading}
            currentUserId={currentUser?.id}
          />
        )}
      </Suspense>
    </div>
  );
};

export default memo(UsersPage);