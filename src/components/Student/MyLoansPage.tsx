import React, { useState } from 'react';
import { BookOpen, Search, Filter, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const MyLoansPage: React.FC = () => {
  const { loans, equipment, updateLoan, addNotification, users } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const myLoans = loans.filter(loan => loan.userId === user?.id);
  
  const filteredLoans = myLoans.filter(loan => {
    const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
    const matchesSearch = equipmentItem?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: myLoans.length,
    active: myLoans.filter(l => l.status === 'active').length,
    pending: myLoans.filter(l => l.status === 'pending').length,
    overdue: myLoans.filter(l => {
      if (l.status === 'active' && l.preferredEndDate) {
        return new Date() > new Date(l.preferredEndDate);
      }
      return false;
    }).length
  };

  const handleRequestReturn = async (loanId: string) => {
    if (window.confirm('¿Estás seguro de que quieres solicitar la devolución de este equipo?')) {
      setLoading(true);
      try {
        const loan = loans.find(l => l.id === loanId);
        if (!loan) throw new Error('Préstamo no encontrado');

        await updateLoan(loanId, {
          status: 'return_requested',
          returnRequestDate: new Date()
        });

        // Crear notificación para el docente o administrador
        if (loan.teacherId) {
          await addNotification({
            userId: loan.teacherId,
            type: 'return_request',
            title: 'Solicitud de Devolución',
            message: `El estudiante ${user?.name} ha solicitado devolver un equipo. Revisa la solicitud.`,
            relatedLoanId: loanId
          });
        } else {
          // Si no tiene docente asignado, notificar a administradores
          const admins = users.filter(u => u.role === 'admin');
          for (const admin of admins) {
            await addNotification({
              userId: admin.id,
              type: 'return_request',
              title: 'Solicitud de Devolución',
              message: `El estudiante ${user?.name} ha solicitado devolver un equipo. Revisa la solicitud.`,
              relatedLoanId: loanId
            });
          }
        }

        alert('Solicitud de devolución enviada. Tu docente procesará la devolución.');
      } catch (error) {
        console.error('Error requesting return:', error);
        alert('Error al solicitar la devolución');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: string, preferredEndDate?: Date) => {
    // Check if loan is overdue
    const isOverdue = status === 'active' && preferredEndDate && new Date() > new Date(preferredEndDate);
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', text: 'Aprobado', icon: CheckCircle },
      active: { color: 'bg-blue-100 text-blue-800', text: 'Activo', icon: BookOpen },
      return_requested: { color: 'bg-purple-100 text-purple-800', text: 'Devolución Solicitada', icon: Package },
      returned: { color: 'bg-gray-100 text-gray-800', text: 'Devuelto', icon: CheckCircle },
      overdue: { color: 'bg-red-100 text-red-800', text: 'Vencido', icon: AlertTriangle },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rechazado', icon: XCircle }
    };
    
    const finalStatus = isOverdue ? 'overdue' : status;
    const config = statusConfig[finalStatus as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getDaysRemaining = (preferredEndDate: Date) => {
    const today = new Date();
    const returnDate = new Date(preferredEndDate);
    const diffTime = returnDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    description: string;
  }> = ({ title, value, icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Préstamos</h1>
          <p className="text-gray-600">Historial y estado de tus solicitudes de préstamo</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por equipo o propósito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="active">Activos</option>
              <option value="return_requested">Devolución Solicitada</option>
              <option value="returned">Devueltos</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Préstamos"
          value={stats.total}
          icon={<BookOpen className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          description="Historial completo"
        />
        <StatCard
          title="Activos"
          value={stats.active}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          description="En tu posesión"
        />
        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-50"
          description="Esperando aprobación"
        />
        <StatCard
          title="Vencidos"
          value={stats.overdue}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
          description="Requieren devolución"
        />
      </div>

      {/* Lista de préstamos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Préstamos ({filteredLoans.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredLoans.length > 0 ? (
            filteredLoans
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((loan) => {
                const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
                const daysRemaining = loan.status === 'active' ? getDaysRemaining(loan.preferredEndDate) : null;
                const isOverdue = daysRemaining !== null && daysRemaining < 0;
                // El botón de devolución está siempre disponible para préstamos activos
                const canRequestReturn = loan.status === 'active';
                
                return (
                  <div key={loan.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {equipmentItem?.name || 'Equipo no encontrado'}
                          </h4>
                          {getStatusBadge(loan.status, loan.preferredEndDate)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">Código:</span> {equipmentItem?.code}</p>
                            <p><span className="font-medium">Propósito:</span> {loan.purpose}</p>
                            <p><span className="font-medium">Solicitado:</span> {new Date(loan.requestDate).toLocaleDateString('es-ES')}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Inicio preferido:</span> {new Date(loan.preferredStartDate).toLocaleDateString('es-ES')}</p>
                            <p><span className="font-medium">Fin preferido:</span> {new Date(loan.preferredEndDate).toLocaleDateString('es-ES')}</p>
                            {loan.actualStartDate && (
                              <p><span className="font-medium">Inicio real:</span> {new Date(loan.actualStartDate).toLocaleDateString('es-ES')}</p>
                            )}
                            {loan.actualEndDate && (
                              <p><span className="font-medium">Fin real:</span> {new Date(loan.actualEndDate).toLocaleDateString('es-ES')}</p>
                            )}
                          </div>
                        </div>

                        {loan.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notas:</span> {loan.notes}
                            </p>
                          </div>
                        )}

                        {loan.returnNotes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notas de devolución:</span> {loan.returnNotes}
                            </p>
                          </div>
                        )}

                        {loan.equipmentConditionOnReturn && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Estado al devolver:</span> {loan.equipmentConditionOnReturn}
                            </p>
                            {loan.equipmentConditionNotes && (
                              <p className="text-sm text-blue-700 mt-1">
                                <span className="font-medium">Observaciones:</span> {loan.equipmentConditionNotes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-6 text-right space-y-2">
                        {loan.status === 'active' && daysRemaining !== null && (
                          <div className={`text-sm font-medium ${
                            isOverdue ? 'text-red-600' : 
                            daysRemaining <= 2 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {isOverdue 
                              ? `Vencido hace ${Math.abs(daysRemaining)} día(s)`
                              : `${daysRemaining} día(s) restante(s)`
                            }
                          </div>
                        )}

                        {canRequestReturn && loan.status !== 'return_requested' && (
                          <button
                            onClick={() => handleRequestReturn(loan.id)}
                            disabled={loading}
                            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Package className="w-4 h-4" />
                            <span>Solicitar Devolución</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Alertas especiales */}
                    {isOverdue && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                          <p className="text-sm text-red-800 font-medium">
                            Este préstamo está vencido. Por favor, devuelve el equipo lo antes posible.
                          </p>
                        </div>
                      </div>
                    )}

                    {loan.status === 'return_requested' && (
                      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-purple-600 mr-2" />
                          <p className="text-sm text-purple-800 font-medium">
                            Devolución solicitada. Tu docente procesará la devolución pronto.
                          </p>
                        </div>
                      </div>
                    )}

                    {loan.status === 'active' && daysRemaining !== null && daysRemaining <= 2 && daysRemaining > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                          <p className="text-sm text-yellow-800 font-medium">
                            Recuerda devolver este equipo pronto. Solo quedan {daysRemaining} día(s).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron préstamos</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no has solicitado ningún préstamo'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLoansPage;