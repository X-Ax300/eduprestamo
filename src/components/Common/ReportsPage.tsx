import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Filter, Users, Package, BookOpen, TrendingUp } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const ReportsPage: React.FC = () => {
  const { equipment, loans, users } = useData();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Filter data based on user role
  const getFilteredData = () => {
    if (user?.role === 'admin') {
      return { loans, users, equipment };
    } else if (user?.role === 'teacher') {
      const myStudents = users.filter(u => u.role === 'student' && u.teacherId === user.id);
      const myStudentIds = myStudents.map(s => s.id);
      const myLoans = loans.filter(loan => myStudentIds.includes(loan.userId));
      return { loans: myLoans, users: myStudents, equipment };
    }
    return { loans: [], users: [], equipment: [] };
  };

  const { loans: filteredLoans, users: filteredUsers } = getFilteredData();

  // Filter by date range
  const loansInRange = filteredLoans.filter(loan => {
    const loanDate = new Date(loan.createdAt);
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    return loanDate >= start && loanDate <= end;
  });

  // Calculate statistics
  const stats = {
    totalLoans: loansInRange.length,
    activeLoans: loansInRange.filter(l => l.status === 'active').length,
    completedLoans: loansInRange.filter(l => l.status === 'returned').length,
    overdueLoans: loansInRange.filter(l => {
      if (l.status === 'active' && l.expectedReturnDate) {
        return new Date() > new Date(l.expectedReturnDate);
      }
      return false;
    }).length,
    totalStudents: filteredUsers.length,
    activeStudents: filteredUsers.filter(u => u.isActive).length,
    totalEquipment: equipment.length,
    availableEquipment: equipment.filter(eq => eq.status === 'available').length
  };

  // Equipment usage statistics
  const equipmentUsage = equipment.map(eq => {
    const equipmentLoans = loansInRange.filter(loan => loan.equipmentId === eq.id);
    return {
      name: eq.name,
      code: eq.code,
      category: eq.category,
      totalLoans: equipmentLoans.length,
      activeLoans: equipmentLoans.filter(l => l.status === 'active').length,
      completedLoans: equipmentLoans.filter(l => l.status === 'returned').length
    };
  }).sort((a, b) => b.totalLoans - a.totalLoans);

  // Student activity statistics
  const studentActivity = filteredUsers.map(student => {
    const studentLoans = loansInRange.filter(loan => loan.userId === student.id);
    return {
      name: student.name,
      matricula: student.matricula,
      totalLoans: studentLoans.length,
      activeLoans: studentLoans.filter(l => l.status === 'active').length,
      completedLoans: studentLoans.filter(l => l.status === 'returned').length,
      overdueLoans: studentLoans.filter(l => {
        if (l.status === 'active' && l.expectedReturnDate) {
          return new Date() > new Date(l.expectedReturnDate);
        }
        return false;
      }).length
    };
  }).sort((a, b) => b.totalLoans - a.totalLoans);

  // Category statistics
  const categoryStats = equipment.reduce((acc, eq) => {
    const category = eq.category;
    if (!acc[category]) {
      acc[category] = {
        total: 0,
        available: 0,
        loaned: 0,
        damaged: 0,
        totalLoans: 0
      };
    }
    acc[category].total++;
    if (eq.status === 'available') acc[category].available++;
    if (eq.status === 'loaned') acc[category].loaned++;
    if (eq.status === 'damaged') acc[category].damaged++;
    
    const equipmentLoans = loansInRange.filter(loan => loan.equipmentId === eq.id);
    acc[category].totalLoans += equipmentLoans.length;
    
    return acc;
  }, {} as Record<string, any>);

  const handleExportReport = () => {
    const reportData = {
      reportType: selectedReport,
      dateRange,
      generatedBy: user?.name,
      generatedAt: new Date().toISOString(),
      stats,
      equipmentUsage: selectedReport === 'equipment' ? equipmentUsage : undefined,
      studentActivity: selectedReport === 'students' ? studentActivity : undefined,
      categoryStats: selectedReport === 'categories' ? categoryStats : undefined
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `reporte-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    description?: string;
  }> = ({ title, value, icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes y Análisis</h1>
          <p className="text-gray-600 dark:text-white">
            {user?.role === 'admin' 
              ? 'Análisis completo del sistema de préstamos'
              : 'Reportes de tus estudiantes y préstamos'
            }
          </p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Reporte</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Reporte
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-100 transition-colors"
            >
              <option value="overview">Resumen General</option>
              <option value="equipment">Uso de Equipos</option>
              <option value="students">Actividad de Estudiantes</option>
              <option value="categories">Por Categorías</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-100 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparentdark:bg-gray-100 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Préstamos"
          value={stats.totalLoans}
          icon={<BookOpen className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          description="En el período seleccionado"
        />
        <StatCard
          title="Préstamos Activos"
          value={stats.activeLoans}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          description="Actualmente en curso"
        />
        <StatCard
          title="Préstamos Vencidos"
          value={stats.overdueLoans}
          icon={<Calendar className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
          description="Requieren atención"
        />
        <StatCard
          title={user?.role === 'admin' ? 'Total Activos' : 'Mis Estudiantes'}
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
          description={`${stats.activeStudents} activos`}
        />
      </div>

      {/* Contenido del reporte según selección */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Préstamos</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completados</span>
                <span className="font-medium text-green-600">{stats.completedLoans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Activos</span>
                <span className="font-medium text-blue-600">{stats.activeLoans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vencidos</span>
                <span className="font-medium text-red-600">{stats.overdueLoans}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Equipos</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="font-medium text-gray-900">{stats.totalEquipment}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Disponibles</span>
                <span className="font-medium text-green-600">{stats.availableEquipment}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">En Préstamo</span>
                <span className="font-medium text-blue-600">
                  {equipment.filter(eq => eq.status === 'loaned').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'equipment' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 dark:bg-gray-300 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900">Uso de Equipos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Préstamos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {equipmentUsage.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.totalLoans}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.activeLoans}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.completedLoans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'students' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 dark:bg-gray-300 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900">Actividad de Estudiantes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Préstamos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completados</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studentActivity.slice(0, 10).map((student, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.matricula}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.totalLoans}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{student.activeLoans}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{student.completedLoans}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{student.overdueLoans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'categories' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Estadísticas por Categoría</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Equipos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponibles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">En Préstamo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Préstamos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <tr key={category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stats.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{stats.available}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{stats.loaned}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">{stats.totalLoans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;