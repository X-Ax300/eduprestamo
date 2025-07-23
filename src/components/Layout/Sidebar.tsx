import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Users, 
  Settings, 
  BookOpen,
  UserCheck,
  BarChart3,
  Bell,
  Archive,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/' }
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { icon: Package, label: 'Inventario', path: '/inventory' },
          { icon: Users, label: 'Usuarios', path: '/users' },
          { icon: BookOpen, label: 'Préstamos', path: '/loans' },
          { icon: Archive, label: 'Devoluciones', path: '/returns' },
          { icon: Users, label: 'Estudiantes', path: '/students' },
          { icon: BarChart3, label: 'Reportes', path: '/reports' },
          { icon: Bell, label: 'Notificaciones', path: '/notifications' },
          { icon: User, label: 'Mi Perfil', path: '/profile' },
          { icon: Settings, label: 'Configuración', path: '/settings' }
        ];
      case 'teacher':
        return [
          ...baseItems,
          { icon: Users, label: 'Estudiantes', path: '/students' },
          { icon: BookOpen, label: 'Préstamos', path: '/loans' },
          { icon: UserCheck, label: 'Aprobaciones', path: '/approvals' },
          { icon: BarChart3, label: 'Reportes', path: '/reports' },
          { icon: Bell, label: 'Notificaciones', path: '/notifications' },
          { icon: User, label: 'Mi Perfil', path: '/profile' }
        ];
      case 'student':
        return [
          ...baseItems,
          { icon: Package, label: 'Equipos', path: '/equipment' },
          { icon: BookOpen, label: 'Mis Préstamos', path: '/my-loans' },
          { icon: Bell, label: 'Notificaciones', path: '/notifications' },
          { icon: User, label: 'Mi Perfil', path: '/profile' }
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">EP</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">EduPrestamo</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sistema de Préstamos</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-3">
              <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">Versión 1.0.3</p>
              <p className="text-xs text-blue-500 dark:text-blue-400">Sistema de Gestión Educativa</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;