import React from 'react';
import { Package, BookOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard: React.FC = () => {
  const { equipment, loans } = useData();
  const { user } = useAuth();

  const myLoans = loans.filter(loan => loan.userId === user?.id);
  
  const stats = {
    availableEquipment: equipment.filter(eq => eq.status === 'available').length,
    myActiveLoans: myLoans.filter(loan => loan.status === 'active').length,
    myPendingLoans: myLoans.filter(loan => loan.status === 'pending').length,
    myOverdueLoans: myLoans.filter(loan => {
      if (loan.status === 'active' && loan.expectedReturnDate) {
        return new Date() > new Date(loan.expectedReturnDate);
      }
      return false;
    }).length
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Aprobado' },
      active: { color: 'bg-blue-100 text-blue-800', text: 'Activo' },
      returned: { color: 'bg-gray-100 text-gray-800', text: 'Devuelto' },
      overdue: { color: 'bg-red-100 text-red-800', text: 'Vencido' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rechazado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getDaysUntilReturn = (expectedReturnDate: Date) => {
    const today = new Date();
    const returnDate = new Date(expectedReturnDate);
    const diffTime = returnDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Dashboard</h1>
          <p className="text-gray-600">Bienvenido, {user?.name}</p>
          {user?.matricula && (
            <p className="text-sm text-gray-500">Matrícula: {user.matricula}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Fecha actual</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Equipos Disponibles"
          value={stats.availableEquipment}
          icon={<Package className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          description="Listos para solicitar"
        />
        <StatCard
          title="Mis Préstamos Activos"
          value={stats.myActiveLoans}
          icon={<BookOpen className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          description="En mi posesión"
        />
        <StatCard
          title="Solicitudes Pendientes"
          value={stats.myPendingLoans}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-50"
          description="Esperando aprobación"
        />
        <StatCard
          title="Préstamos Vencidos"
          value={stats.myOverdueLoans}
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
          description="Debo devolver urgente"
        />
      </div>

      {/* My Loans and Available Equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Mis Préstamos Activos</h3>
            <p className="text-sm text-gray-500">Equipos que tienes en préstamo</p>
          </div>
          <div className="p-6">
            {myLoans.filter(loan => loan.status === 'active').length > 0 ? (
              <div className="space-y-4">
                {myLoans
                  .filter(loan => loan.status === 'active')
                  .map((loan) => {
                    const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
                    const daysUntilReturn = getDaysUntilReturn(loan.expectedReturnDate);
                    const isOverdue = daysUntilReturn < 0;
                    
                    return (
                      <div key={loan.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{equipmentItem?.name}</h4>
                          {getStatusBadge(loan.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{loan.purpose}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Prestado: {new Date(loan.loanDate || '').toLocaleDateString('es-ES')}
                          </span>
                          <span className={`font-medium ${isOverdue ? 'text-red-600' : daysUntilReturn <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {isOverdue 
                              ? `Vencido hace ${Math.abs(daysUntilReturn)} día(s)`
                              : `${daysUntilReturn} día(s) restante(s)`
                            }
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">No tienes préstamos activos</p>
                <p className="text-sm text-gray-400">¡Perfecto! Todos tus equipos han sido devueltos</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Equipos Disponibles</h3>
            <p className="text-sm text-gray-500">Equipos que puedes solicitar</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {equipment
                .filter(eq => eq.status === 'available')
                .slice(0, 4)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.brand} {item.model}</p>
                      <p className="text-xs text-gray-400">Código: {item.code}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Disponible
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            {equipment.filter(eq => eq.status === 'available').length > 4 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver todos los equipos disponibles
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-blue-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-900">Solicitar Equipo</p>
            <p className="text-sm text-blue-600">Ver equipos disponibles</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-green-300 rounded-lg text-center hover:border-green-400 hover:bg-green-50 transition-colors">
            <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-900">Mis Préstamos</p>
            <p className="text-sm text-green-600">Ver historial completo</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-purple-300 rounded-lg text-center hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-purple-900">Devolver Equipo</p>
            <p className="text-sm text-purple-600">Registrar devolución</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;