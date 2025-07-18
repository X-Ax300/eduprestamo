import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Filter, CheckCircle, XCircle, Clock, Eye, X, Package } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const ApprovalsPage: React.FC = () => {
  const { loans, equipment, users, updateLoan, addNotification } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [myStudents, setMyStudents] = useState<any[]>([]);

  // Form state for return approval
  const [returnData, setReturnData] = useState({
    equipmentConditionOnReturn: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'damaged',
    equipmentConditionNotes: '',
    returnNotes: ''
  });

  // Get students assigned to this teacher
  useEffect(() => {
    if (user?.id) {
      const studentsAssigned = users.filter(u => 
        u.role === 'student' && 
        u.teacherId === user.id && 
        u.isActive
      );
      setMyStudents(studentsAssigned);
    }
  }, [users, user?.id]);

  const myStudentIds = myStudents.map(s => s.id);

  // Filter loans for my students - include all relevant loans
  const myStudentLoans = loans.filter(loan => {
    // Include loans where teacher is explicitly assigned
    const isDirectlyAssigned = loan.teacherId === user?.id;
    // Include loans from students assigned to this teacher
    const isMyStudent = myStudentIds.includes(loan.userId);
    
    return isDirectlyAssigned || isMyStudent;
  });
  
  const filteredLoans = myStudentLoans.filter(loan => {
    const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
    const student = users.find(u => u.id === loan.userId);
    const matchesSearch = equipmentItem?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: myStudentLoans.filter(l => l.status === 'pending').length,
    returnRequests: myStudentLoans.filter(l => l.status === 'return_requested').length,
    approved: myStudentLoans.filter(l => l.status === 'approved' || l.status === 'active').length,
    rejected: myStudentLoans.filter(l => l.status === 'rejected').length,
    total: myStudentLoans.length
  };

  const handleApproveLoan = async (loanId: string) => {
    setLoading(true);
    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) throw new Error('Préstamo no encontrado');

      await updateLoan(loanId, {
        status: 'approved',
        approvedDate: new Date(),
        actualStartDate: new Date(),
        approvedBy: user!.id
      });

      // Crear notificación para el estudiante
      await addNotification({
        userId: loan.userId,
        type: 'approved',
        title: 'Préstamo Aprobado',
        message: `Tu solicitud de préstamo ha sido aprobada por tu docente. Puedes recoger el equipo.`,
        relatedLoanId: loanId
      });

      alert('Préstamo aprobado exitosamente');
    } catch (error) {
      console.error('Error approving loan:', error);
      alert('Error al aprobar el préstamo');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    const reason = prompt('Motivo del rechazo (opcional):');
    setLoading(true);
    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) throw new Error('Préstamo no encontrado');

      await updateLoan(loanId, {
        status: 'rejected',
        returnNotes: reason || 'Rechazado por el docente'
      });

      // Crear notificación para el estudiante
      await addNotification({
        userId: loan.userId,
        type: 'rejected',
        title: 'Préstamo Rechazado',
        message: `Tu solicitud de préstamo ha sido rechazada. ${reason ? `Motivo: ${reason}` : ''}`,
        relatedLoanId: loanId
      });

      alert('Préstamo rechazado');
    } catch (error) {
      console.error('Error rejecting loan:', error);
      alert('Error al rechazar el préstamo');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReturn = (loan: any) => {
    setSelectedLoan(loan);
    setReturnData({
      equipmentConditionOnReturn: 'good',
      equipmentConditionNotes: '',
      returnNotes: ''
    });
    setShowReturnModal(true);
  };

  const handleSubmitReturnApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateLoan(selectedLoan.id, {
        status: 'returned',
        actualEndDate: new Date(),
        returnDate: new Date(),
        equipmentConditionOnReturn: returnData.equipmentConditionOnReturn,
        equipmentConditionNotes: returnData.equipmentConditionNotes,
        returnNotes: returnData.returnNotes,
        returnApprovedBy: user!.id
      });

      // Crear notificación para el estudiante
      await addNotification({
        userId: selectedLoan.userId,
        type: 'return_approved',
        title: 'Devolución Aprobada',
        message: `Tu devolución ha sido aprobada y procesada. Estado del equipo: ${returnData.equipmentConditionOnReturn}`,
        relatedLoanId: selectedLoan.id
      });

      setShowReturnModal(false);
      setSelectedLoan(null);
      alert('Devolución aprobada y procesada exitosamente');
    } catch (error) {
      console.error('Error approving return:', error);
      alert('Error al aprobar la devolución');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (loan: any) => {
    setSelectedLoan(loan);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', text: 'Aprobado', icon: CheckCircle },
      active: { color: 'bg-blue-100 text-blue-800', text: 'Activo', icon: CheckCircle },
      return_requested: { color: 'bg-purple-100 text-purple-800', text: 'Devolución Solicitada', icon: Package },
      returned: { color: 'bg-gray-100 text-gray-800', text: 'Devuelto', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rechazado', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aprobaciones de Préstamos</h1>
          <p className="text-gray-600 dark:text-white">
            Gestiona las solicitudes de préstamo y devoluciones de tus estudiantes
            {myStudents.length > 0 && (
              <span className="block text-sm text-gray-500 mt-1 dark:text-white">
                Tienes {myStudents.length} estudiante(s) asignado(s) • {stats.pending} solicitud(es) pendiente(s) • {stats.returnRequests} devolución(es) pendiente(s)
              </span>
            )}
          </p>
        </div>
      </div>

      {myStudents.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              <strong>No tienes estudiantes asignados.</strong> Los estudiantes deben especificar tu ID como docente asignado para que puedas ver y aprobar sus solicitudes de préstamo.
            </p>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por equipo, estudiante o propósito..."
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
              <option value="pending">Pendientes</option>
              <option value="return_requested">Devoluciones Solicitadas</option>
              <option value="all">Todos los estados</option>
              <option value="approved">Aprobados</option>
              <option value="active">Activos</option>
              <option value="returned">Devueltos</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-50"
          description="Requieren aprobación"
        />
        <StatCard
          title="Devoluciones"
          value={stats.returnRequests}
          icon={<Package className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
          description="Solicitudes de devolución"
        />
        <StatCard
          title="Aprobados"
          value={stats.approved}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          description="Aprobados y activos"
        />
        <StatCard
          title="Rechazados"
          value={stats.rejected}
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
          description="No aprobados"
        />
        <StatCard
          title="Total"
          value={stats.total}
          icon={<UserCheck className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          description="Todas las solicitudes"
        />
      </div>

      {/* Lista de solicitudes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 dark:bg-gray-300 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 ">
            Solicitudes de Préstamo ({filteredLoans.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-300">
          {filteredLoans.length > 0 ? (
            filteredLoans
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((loan) => {
                const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
                const student = users.find(u => u.id === loan.userId);
                
                return (
                  <div key={loan.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-400 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {equipmentItem?.name || 'Equipo no encontrado'}
                          </h4>
                          {getStatusBadge(loan.status)}
                          {(loan.teacherId === user?.id || myStudentIds.includes(loan.userId)) && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {loan.teacherId === user?.id ? 'Asignado directamente' : 'Tu estudiante'}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <p><span className="font-medium">Estudiante:</span> {student?.name}</p>
                            <p><span className="font-medium">Matrícula:</span> {student?.matricula}</p>
                            <p><span className="font-medium">Código equipo:</span> {equipmentItem?.code}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Propósito:</span> {loan.purpose}</p>
                            <p><span className="font-medium">Solicitado:</span> {new Date(loan.requestDate).toLocaleDateString('es-ES')}</p>
                            <p><span className="font-medium">Inicio preferido:</span> {new Date(loan.preferredStartDate).toLocaleDateString('es-ES')}</p>
                            <p><span className="font-medium">Fin preferido:</span> {new Date(loan.preferredEndDate).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>

                        {loan.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notas:</span> {loan.notes}
                            </p>
                          </div>
                        )}

                        {loan.returnRequestDate && (
                          <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-800">
                              <span className="font-medium">Solicitud de devolución:</span> {new Date(loan.returnRequestDate).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => handleViewDetails(loan)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver detalles</span>
                        </button>

                        {loan.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveLoan(loan.id)}
                              disabled={loading}
                              className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => handleRejectLoan(loan.id)}
                              disabled={loading}
                              className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        )}

                        {loan.status === 'return_requested' && (
                          <button
                            onClick={() => handleApproveReturn(loan)}
                            disabled={loading}
                            className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                          >
                            <Package className="w-4 h-4" />
                            <span>Procesar Devolución</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : myStudents.length === 0 
                    ? 'No tienes estudiantes asignados. Los estudiantes deben especificar tu ID como docente.'
                    : 'No hay solicitudes de préstamo pendientes de tus estudiantes'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      {showDetailModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detalles de la Solicitud</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del equipo */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Información del Equipo</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {(() => {
                    const equipmentItem = equipment.find(eq => eq.id === selectedLoan.equipmentId);
                    return (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Nombre:</span> {equipmentItem?.name}</p>
                          <p><span className="font-medium">Marca:</span> {equipmentItem?.brand}</p>
                          <p><span className="font-medium">Modelo:</span> {equipmentItem?.model}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Código:</span> {equipmentItem?.code}</p>
                          <p><span className="font-medium">Categoría:</span> {equipmentItem?.category}</p>
                          <p><span className="font-medium">Ubicación:</span> {equipmentItem?.location}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Información del estudiante */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Información del Estudiante</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {(() => {
                    const student = users.find(u => u.id === selectedLoan.userId);
                    return (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Nombre:</span> {student?.name}</p>
                          <p><span className="font-medium">Email:</span> {student?.email}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Matrícula:</span> {student?.matricula}</p>
                          <p><span className="font-medium">Estado:</span> {student?.isActive ? 'Activo' : 'Inactivo'}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Detalles del préstamo */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Detalles del Préstamo</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Estado:</span>
                      {getStatusBadge(selectedLoan.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Propósito:</span>
                      <span>{selectedLoan.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de solicitud:</span>
                      <span>{new Date(selectedLoan.requestDate).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Inicio preferido:</span>
                      <span>{new Date(selectedLoan.preferredStartDate).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fin preferido:</span>
                      <span>{new Date(selectedLoan.preferredEndDate).toLocaleDateString('es-ES')}</span>
                    </div>
                    {selectedLoan.returnRequestDate && (
                      <div className="flex justify-between">
                        <span className="font-medium">Solicitud de devolución:</span>
                        <span>{new Date(selectedLoan.returnRequestDate).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                  </div>

                  {selectedLoan.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm">
                        <span className="font-medium">Notas del estudiante:</span><br />
                        {selectedLoan.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              {selectedLoan.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleRejectLoan(selectedLoan.id);
                      setShowDetailModal(false);
                    }}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar</span>
                  </button>
                  <button
                    onClick={() => {
                      handleApproveLoan(selectedLoan.id);
                      setShowDetailModal(false);
                    }}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Aprobar</span>
                  </button>
                </div>
              )}

              {selectedLoan.status === 'return_requested' && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleApproveReturn(selectedLoan);
                    }}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Package className="w-4 h-4" />
                    <span>Procesar Devolución</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para procesar devolución */}
      {showReturnModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Procesar Devolución</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturnApproval} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Información del Préstamo</h4>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Equipo:</span> {equipment.find(eq => eq.id === selectedLoan.equipmentId)?.name}</p>
                  <p><span className="font-medium">Estudiante:</span> {users.find(u => u.id === selectedLoan.userId)?.name}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del equipo al momento de la devolución *
                </label>
                <select
                  value={returnData.equipmentConditionOnReturn}
                  onChange={(e) => setReturnData(prev => ({ ...prev, equipmentConditionOnReturn: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="excellent">Excelente - Como nuevo</option>
                  <option value="good">Bueno - Funciona perfectamente</option>
                  <option value="fair">Regular - Funciona con desgaste menor</option>
                  <option value="poor">Malo - Funciona pero con problemas</option>
                  <option value="damaged">Dañado - No funciona o dañado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones sobre el estado del equipo
                </label>
                <textarea
                  value={returnData.equipmentConditionNotes}
                  onChange={(e) => setReturnData(prev => ({ ...prev, equipmentConditionNotes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe cualquier daño, desgaste o problema observado..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas generales de la devolución
                </label>
                <textarea
                  value={returnData.returnNotes}
                  onChange={(e) => setReturnData(prev => ({ ...prev, returnNotes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Comentarios adicionales sobre la devolución..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Package className="w-4 h-4" />
                  <span>{loading ? 'Procesando...' : 'Aprobar Devolución'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;