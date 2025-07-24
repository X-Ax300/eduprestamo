import React, { useEffect, useState } from 'react';
import { Users, BookOpen, CheckCircle, Clock, UserCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getStudentsByTeacher } from '../../services/userService';
import { User } from '../../types';

const TeacherDashboard: React.FC = () => {
  const { loans } = useData();
  const { user } = useAuth();
  const [myStudents, setMyStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyStudents = async () => {
      if (user?.id) {
        try {
          const students = await getStudentsByTeacher(user.id);
          setMyStudents(students);
        } catch (error) {
          console.error('Error fetching students:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMyStudents();
  }, [user?.id]);

  const myStudentLoans = loans.filter(loan => 
    myStudents.some(student => student.id === loan.userId)
  );

  const stats = {
    totalStudents: myStudents.length,
    activeLoans: myStudentLoans.filter(loan => loan.status === 'active').length,
    pendingApprovals: myStudentLoans.filter(loan => loan.status === 'pending').length,
    overdueLoans: myStudentLoans.filter(loan => {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-200">
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">EP</span>
          </div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Docente</h1>
          <p className="text-gray-600 dark:text-white">Bienvenido, {user?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-white">Fecha actual</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mis Estudiantes"
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          description="Bajo mi supervisión"
        />
        <StatCard
          title="Préstamos Activos"
          value={stats.activeLoans}
          icon={<BookOpen className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          description="En curso"
        />
        <StatCard
          title="Pendientes de Aprobación"
          value={stats.pendingApprovals}
          icon={<UserCheck className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-50"
          description="Requieren aprobación"
        />
        <StatCard
          title="Préstamos Vencidos"
          value={stats.overdueLoans}
          icon={<Clock className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
          description="Requieren seguimiento"
        />
      </div>

      {/* Students and Loans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Mis Estudiantes</h3>
            <p className="text-sm text-gray-500">Estudiantes bajo mi supervisión</p>
          </div>
          <div className="p-6">
            {myStudents.length > 0 ? (
              <div className="space-y-4">
                {myStudents.map((student) => {
                  const studentLoans = myStudentLoans.filter(loan => loan.userId === student.id);
                  const activeLoans = studentLoans.filter(loan => loan.status === 'active').length;
                  
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">Matrícula: {student.matricula}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {activeLoans} préstamo{activeLoans !== 1 ? 's' : ''} activo{activeLoans !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">{studentLoans.length} total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No tienes estudiantes asignados</p>
                <p className="text-sm text-gray-400">Los estudiantes deben especificar tu ID al registrarse</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-200">
          <div className="p-6 border-b border-dark-200">
            <h3 className="text-lg font-semibold text-gray-900">Solicitudes Recientes</h3>
            <p className="text-sm text-gray-500">Últimas solicitudes de préstamo</p>
          </div>
          <div className="p-6">
            {myStudentLoans.length > 0 ? (
              <div className="space-y-4">
                {myStudentLoans
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((loan) => {
                    const student = myStudents.find(s => s.id === loan.userId);
                    return (
                      <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{student?.name}</p>
                          <p className="text-sm text-gray-500">{loan.purpose}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(loan.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(loan.status)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay solicitudes recientes</p>
                <p className="text-sm text-gray-400">Las solicitudes de tus estudiantes aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default TeacherDashboard;