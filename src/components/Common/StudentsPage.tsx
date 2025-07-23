import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, BookOpen, User, Mail } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getStudentsByTeacher } from '../../services/userService';

const StudentsPage: React.FC = () => {
  const { users, loans, equipment } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (user?.role === 'admin') {
          // Admin can see all students
          const allStudents = users.filter(u => u.role === 'student');
          setMyStudents(allStudents);
        } else if (user?.role === 'teacher') {
          // Teacher can only see their assigned students
          const students = await getStudentsByTeacher(user.id);
          setMyStudents(students);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudents();
    }
  }, [user, users]);

  const filteredStudents = myStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.matricula && student.matricula.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && student.isActive) ||
                         (statusFilter === 'inactive' && !student.isActive);
    return matchesSearch && matchesStatus;
  });

  const getStudentStats = (studentId: string) => {
    const studentLoans = loans.filter(loan => loan.userId === studentId);
    return {
      total: studentLoans.length,
      active: studentLoans.filter(l => l.status === 'active').length,
      pending: studentLoans.filter(l => l.status === 'pending').length,
      overdue: studentLoans.filter(l => {
        if (l.status === 'active' && l.expectedReturnDate) {
          return new Date() > new Date(l.expectedReturnDate);
        }
        return false;
      }).length
    };
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'Sin asignar';
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    return teacher ? teacher.name : 'Docente no encontrado';
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Activo' : 'Inactivo'}
      </span>
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 overflow-hidden bg-gray-200">
            <img 
              src="https://images.genius.com/f28c9297b4b1d0d8aa32979d958805cb.640x640x1.jpg" 
              alt="Foto de perfil" 
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-gray-600 dark:text-white">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'admin' ? 'Todos los Estudiantes' : 'Mis Estudiantes'}
          </h1>
          <p className="text-gray-600 dark:text-white">
            {user?.role === 'admin' 
              ? 'Gestiona todos los estudiantes del sistema'
              : 'Estudiantes bajo tu supervisión'
            }
          </p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-100 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-100 transition-colors"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Estudiantes"
          value={myStudents.length}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          description={user?.role === 'admin' ? 'En el sistema' : 'Bajo tu supervisión'}
        />
        <StatCard
          title="Activos"
          value={myStudents.filter(s => s.isActive).length}
          icon={<User className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          description="Estudiantes activos"
        />
        <StatCard
          title="Con Préstamos"
          value={myStudents.filter(s => {
            const stats = getStudentStats(s.id);
            return stats.active > 0;
          }).length}
          icon={<BookOpen className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
          description="Tienen equipos prestados"
        />
        <StatCard
          title="Resultados"
          value={filteredStudents.length}
          icon={<Search className="w-6 h-6 text-gray-600" />}
          color="bg-gray-50"
          description="Coinciden con filtros"
        />
      </div>

      {/* Lista de estudiantes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 dark:bg-gray-300 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Estudiantes ({filteredStudents.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-300 transition-colors">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-300 transition-colors">
                  Matrícula
                </th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-300 transition-colors">
                    Docente Asignado
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-300 transition-colors">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-300 transition-colors">
                  Préstamos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:bg-gray-300 transition-colors">
                  Fecha Registro
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-300 transition-colors">
              {filteredStudents.map((student) => {
                const stats = getStudentStats(student.id);
                
                return (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-400">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.matricula || 'No asignada'}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTeacherName(student.teacherId)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex space-x-4">
                          <span className="text-blue-600 font-medium">
                            Activos: {stats.active}
                          </span>
                          {stats.pending > 0 && (
                            <span className="text-yellow-600 font-medium">
                              Pendientes: {stats.pending}
                            </span>
                          )}
                          {stats.overdue > 0 && (
                            <span className="text-red-600 font-medium">
                              Vencidos: {stats.overdue}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: {stats.total} préstamos
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.createdAt.toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron estudiantes</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : user?.role === 'admin' 
                ? 'No hay estudiantes registrados en el sistema'
                : 'No tienes estudiantes asignados'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;