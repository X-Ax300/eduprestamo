import React from 'react';
import { 
  Package, 
  Users, 
  BookOpen, 
  AlertCircle, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const { equipment, loans } = useData();
  const { user } = useAuth();

  const stats = {
    totalEquipment: equipment.length,
    availableEquipment: equipment.filter(eq => eq.status === 'available').length,
    activeLoans: loans.filter(loan => loan.status === 'active').length,
    overdueLoans: loans.filter(loan => {
      if (loan.status === 'active' && loan.expectedReturnDate) {
        return new Date() > new Date(loan.expectedReturnDate);
      }
      return false;
    }).length,
    damagedEquipment: equipment.filter(eq => eq.status === 'damaged').length,
    pendingLoans: loans.filter(loan => loan.status === 'pending').length
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    description: string;
  }> = ({ title, value, icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
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

  const recentLoans = loans
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administrador</h1>
          <p className="text-gray-600 dark:text-white">Bienvenido de vuelta, {user?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-white">Último acceso</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Equipos Totales"
          value={stats.totalEquipment}
          icon={<Package className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          description="Inventario completo"
        />
        <StatCard
          title="Equipos Disponibles"
          value={stats.availableEquipment}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          description="Listos para préstamo"
        />
        <StatCard
          title="Préstamos Activos"
          value={stats.activeLoans}
          icon={<BookOpen className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          description="En curso actualmente"
        />
        <StatCard
          title="Préstamos Vencidos"
          value={stats.overdueLoans}
          icon={<Clock className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
          description="Requieren atención"
        />
        <StatCard
          title="Equipos Dañados"
          value={stats.damagedEquipment}
          icon={<AlertCircle className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
          description="En reparación"
        />
        <StatCard
          title="Solicitudes Pendientes"
          value={stats.pendingLoans}
          icon={<XCircle className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-50"
          description="Por aprobar"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-300 transition-colors">
          <div className="p-6 border-b border-gray-200  ">
            <h3 className="text-lg font-semibold text-gray-900">Préstamos Recientes</h3>
            <p className="text-sm text-gray-500">Últimas 5 solicitudes</p>
          </div>
          <div className="p-6">
            {recentLoans.length > 0 ? (
              <div className="space-y-4">
                {recentLoans.map((loan) => {
                  const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
                  return (
                    <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-300 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{equipmentItem?.name}</p>
                        <p className="text-sm text-gray-500"> 
                          {new Date(loan.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right flex items-center">
                        {getStatusBadge(loan.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay préstamos recientes</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-300 transition-colors">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Alertas Importantes</h3>
            <p className="text-sm text-gray-500">Requieren atención inmediata</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.overdueLoans > 0 && (
                <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200 dark:bg-red-300 transition-colors">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {stats.overdueLoans} préstamo(s) vencido(s)
                    </p>
                    <p className="text-xs text-red-600">Contactar usuarios urgentemente</p>
                  </div>
                </div>
              )}
              
              {stats.damagedEquipment > 0 && (
                <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertCircle className="w-5 h-5 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      {stats.damagedEquipment} equipo(s) dañado(s)
                    </p>
                    <p className="text-xs text-orange-600">Programar reparación</p>
                  </div>
                </div>
              )}
              
              {stats.pendingLoans > 0 && (
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {stats.pendingLoans} solicitud(es) pendiente(s)
                    </p>
                    <p className="text-xs text-yellow-600">Revisar y aprobar</p>
                  </div>
                </div>
              )}
              
              {stats.overdueLoans === 0 && stats.damagedEquipment === 0 && stats.pendingLoans === 0 && (
                <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Todo en orden</p>
                    <p className="text-xs text-green-600">No hay alertas pendientes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;