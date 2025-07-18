import React, { useState } from 'react';
import { Bell, Check, Trash2, Filter, Search, AlertCircle, CheckCircle, Clock, XCircle, Package, Eye, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead, loans, equipment, users } = useData();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.isRead) ||
                         (filter === 'read' && notification.isRead) ||
                         notification.type === filter;
    return matchesSearch && matchesFilter;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    try {
      await Promise.all(
        unreadNotifications.map(notification => 
          markNotificationAsRead(notification.id)
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleViewDetails = (notification: any) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    
    // Mark as read when viewing details
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconConfig = {
      overdue: { icon: AlertCircle, color: 'text-red-600' },
      approved: { icon: CheckCircle, color: 'text-green-600' },
      rejected: { icon: XCircle, color: 'text-red-600' },
      reminder: { icon: Clock, color: 'text-yellow-600' },
      damaged: { icon: AlertCircle, color: 'text-orange-600' },
      return_request: { icon: Package, color: 'text-purple-600' },
      return_processed: { icon: CheckCircle, color: 'text-blue-600' }
    };
    
    const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.reminder;
    const Icon = config.icon;
    
    return <Icon className={`w-5 h-5 ${config.color}`} />;
  };

  const getNotificationTypeText = (type: string) => {
    const typeConfig = {
      overdue: 'Préstamo Vencido',
      approved: 'Préstamo Aprobado',
      rejected: 'Préstamo Rechazado',
      reminder: 'Recordatorio',
      damaged: 'Equipo Dañado',
      return_request: 'Solicitud de Devolución',
      return_processed: 'Devolución Procesada'
    };
    
    return typeConfig[type as keyof typeof typeConfig] || 'Notificación';
  };

  const getRelatedLoanDetails = (loanId?: string) => {
    if (!loanId) return null;
    
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return null;
    
    const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
    const student = users.find(u => u.id === loan.userId);
    
    return {
      loan,
      equipment: equipmentItem,
      student
    };
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
          <p className="text-gray-600 dark:text-white">
            Mantente al día con las actualizaciones del sistema
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} sin leer
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Marcar todas como leídas</span>
          </button>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:text-white-300 dark:bg-gray-300 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 " />
              <input
                type="text"
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-100 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="unread">Sin leer</option>
              <option value="read">Leídas</option>
              <option value="overdue">Vencidos</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
              <option value="reminder">Recordatorios</option>
              <option value="damaged">Equipos dañados</option>
              <option value="return_request">Solicitudes de devolución</option>
              <option value="return_processed">Devoluciones procesadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 ">Sin Leer</p>
              <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-orange-600">
                {notifications.filter(n => n.type === 'overdue').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprobados</p>
              <p className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-300 transition-colors">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Notificaciones ({filteredNotifications.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer dark:hover:bg-gray-400 ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleViewDetails(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getNotificationTypeText(notification.type)}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className={`text-sm ${
                        !notification.isRead ? 'text-gray-700' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(notification);
                      }}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'No se encontraron notificaciones con los filtros aplicados'
                  : 'No tienes notificaciones en este momento'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:bg-gray-300 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">Detalles de la Notificación</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 ">
              {/* Información de la notificación */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  {getNotificationIcon(selectedNotification.type)}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{selectedNotification.title}</h4>
                    <p className="text-sm text-gray-500">
                      {getNotificationTypeText(selectedNotification.type)} • {' '}
                      {new Date(selectedNotification.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedNotification.message}</p>
                </div>
              </div>

              {/* Información del préstamo relacionado */}
              {selectedNotification.relatedLoanId && (() => {
                const loanDetails = getRelatedLoanDetails(selectedNotification.relatedLoanId);
                if (!loanDetails) return null;

                const { loan, equipment: equipmentItem, student } = loanDetails;
                
                return (
                  <div>
                    <h5 className="text-md font-semibold text-gray-900 mb-3">Información del Préstamo</h5>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Equipo:</span> {equipmentItem?.name}</p>
                          <p><span className="font-medium">Código:</span> {equipmentItem?.code}</p>
                          <p><span className="font-medium">Propósito:</span> {loan.purpose}</p>
                        </div>
                        <div>
                          {user?.role !== 'student' && student && (
                            <p><span className="font-medium">Estudiante:</span> {student.name}</p>
                          )}
                          <p><span className="font-medium">Estado:</span> {loan.status}</p>
                          <p><span className="font-medium">Inicio preferido:</span> {new Date(loan.preferredStartDate).toLocaleDateString('es-ES')}</p>
                          <p><span className="font-medium">Fin preferido:</span> {new Date(loan.preferredEndDate).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                      
                      {loan.equipmentConditionOnReturn && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-sm">
                            <span className="font-medium">Estado al devolver:</span> {loan.equipmentConditionOnReturn}
                          </p>
                          {loan.equipmentConditionNotes && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">Observaciones:</span> {loan.equipmentConditionNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;