import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { notifications } = useData();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Docente';
      case 'student': return 'Estudiante';
      default: return role;
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EP</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">EduPrestamo</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={handleNotificationsClick}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Ver notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleDisplayName(user?.role || '')}</p>
            </div>
            <button
              onClick={handleProfileClick}
              className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              title="Ver perfil"
            >
              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={logout}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;