import React, { useState } from 'react';
import { Archive, Search, Filter, CheckCircle, AlertTriangle, Package, X, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const ReturnsPage: React.FC = () => {
  const { loans, equipment, users, updateLoan, addNotification } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('return_requested');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state for return processing
  const [returnData, setReturnData] = useState({
    equipmentConditionOnReturn: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'damaged',
    equipmentConditionNotes: '',
    returnNotes: '',
    requiresMaintenance: false
  });

  const returnableLoans = loans.filter(loan => 
    loan.status === 'return_requested' || 
    (loan.status === 'active' && new Date() >= new Date(loan.preferredEndDate))
  );
  
  const filteredLoans = returnableLoans.filter(loan => {
    const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
    const student = users.find(u => u.id === loan.userId);
    const matchesSearch = equipmentItem?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProcessReturn = (loan: any) => {
    setSelectedLoan(loan);
    setReturnData({
      equipmentConditionOnReturn: 'good',
      equipmentConditionNotes: '',
      returnNotes: '',
      requiresMaintenance: false
    });
    setShowReturnModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setReturnData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updates = {
        status: 'returned' as const,
        actualEndDate: new Date(),
        returnDate: new Date(),
        equipmentConditionOnReturn: returnData.equipmentConditionOnReturn,
        equipmentConditionNotes: returnData.equipmentConditionNotes,
        returnNotes: returnData.returnNotes,
        returnProcessedBy: user!.id
      };

      await updateLoan(selectedLoan.id, updates);

      // Update equipment status based on condition
      let equipmentStatus: 'available' | 'damaged' | 'maintenance' = 'available';
      
      if (returnData.equipmentConditionOnReturn === 'damaged') {
        equipmentStatus = 'damaged';
      } else if (returnData.requiresMaintenance) {
        equipmentStatus = 'maintenance';
      }

      // Crear notificación para el estudiante
      await addNotification({
        userId: selectedLoan.userId,
        type: 'return_processed',
        title: 'Devolución Procesada',
        message: `Tu devolución ha sido procesada. Estado del equipo: ${returnData.equipmentConditionOnReturn}`,
        relatedLoanId: selectedLoan.id
      });

      // Si hay daños, crear notificación adicional
      if (returnData.equipmentConditionOnReturn === 'damaged') {
        await addNotification({
          userId: selectedLoan.userId,
          type: 'damaged',
          title: 'Equipo Dañado',
          message: `El equipo devuelto presenta daños. Revisa los detalles en tu historial de préstamos.`,
          relatedLoanId: selectedLoan.id
        });
      }

      setShowReturnModal(false);
      setSelectedLoan(null);
      alert('Devolución procesada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error al procesar la devolución');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, preferredEndDate?: Date) => {
    const isOverdue = status === 'active' && preferredEndDate && new Date() > new Date(preferredEndDate);
    
    const statusConfig = {
      return_requested: { color: 'bg-purple-100 text-purple-800', text: 'Devolución Solicitada' },
      active: { color: 'bg-blue-100 text-blue-800', text: 'Activo' },
      overdue: { color: 'bg-red-100 text-red-800', text: 'Vencido' },
      returned: { color: 'bg-gray-100 text-gray-800', text: 'Devuelto' }
    };
    
    const finalStatus = isOverdue ? 'overdue' : status;
    const config = statusConfig[finalStatus as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = {
      excellent: { color: 'bg-green-100 text-green-800', text: 'Excelente' },
      good: { color: 'bg-blue-100 text-blue-800', text: 'Bueno' },
      fair: { color: 'bg-yellow-100 text-yellow-800', text: 'Regular' },
      poor: { color: 'bg-orange-100 text-orange-800', text: 'Malo' },
      damaged: { color: 'bg-red-100 text-red-800', text: 'Dañado' }
    };
    
    const config = conditionConfig[condition as keyof typeof conditionConfig] || conditionConfig.good;
    
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Devoluciones</h1>
          <p className="text-gray-600">Procesa las devoluciones de equipos y evalúa su estado</p>
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
                placeholder="Buscar por equipo o estudiante..."
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
              <option value="return_requested">Devoluciones Solicitadas</option>
              <option value="all">Todos</option>
              <option value="active">Vencidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Devoluciones Pendientes</p>
              <p className="text-2xl font-bold text-purple-600">
                {loans.filter(l => l.status === 'return_requested').length}
              </p>
            </div>
            <Package className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Préstamos Vencidos</p>
              <p className="text-2xl font-bold text-red-600">
                {loans.filter(l => {
                  if (l.status === 'active' && l.preferredEndDate) {
                    return new Date() > new Date(l.preferredEndDate);
                  }
                  return false;
                }).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Devueltos Hoy</p>
              <p className="text-2xl font-bold text-green-600">
                {loans.filter(l => {
                  if (l.status === 'returned' && l.returnDate) {
                    const today = new Date();
                    const returnDate = new Date(l.returnDate);
                    return today.toDateString() === returnDate.toDateString();
                  }
                  return false;
                }).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total a Procesar</p>
              <p className="text-2xl font-bold text-blue-600">{filteredLoans.length}</p>
            </div>
            <Archive className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Lista de devoluciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Devoluciones Pendientes ({filteredLoans.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredLoans.length > 0 ? (
            filteredLoans.map((loan) => {
              const equipmentItem = equipment.find(eq => eq.id === loan.equipmentId);
              const student = users.find(u => u.id === loan.userId);
              const isOverdue = loan.status === 'active' && new Date() > new Date(loan.preferredEndDate);
              
              return (
                <div key={loan.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {equipmentItem?.name || 'Equipo no encontrado'}
                        </h4>
                        {getStatusBadge(loan.status, loan.preferredEndDate)}
                        {isOverdue && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            URGENTE
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
                          <p><span className="font-medium">Inicio real:</span> {loan.actualStartDate ? new Date(loan.actualStartDate).toLocaleDateString('es-ES') : 'N/A'}</p>
                          <p><span className="font-medium">Fin preferido:</span> {new Date(loan.preferredEndDate).toLocaleDateString('es-ES')}</p>
                          {loan.returnRequestDate && (
                            <p><span className="font-medium">Solicitud de devolución:</span> {new Date(loan.returnRequestDate).toLocaleDateString('es-ES')}</p>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Propósito:</span> {loan.purpose}
                        </p>
                      </div>

                      {loan.notes && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notas del estudiante:</span> {loan.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      <button
                        onClick={() => handleProcessReturn(loan)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        <span>Procesar Devolución</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay devoluciones pendientes</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No se encontraron devoluciones con los filtros aplicados'
                  : 'Todas las devoluciones han sido procesadas'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para procesar devolución */}
      {showReturnModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Procesar Devolución</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Información del préstamo */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Información del Préstamo</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Equipo:</span> {equipment.find(eq => eq.id === selectedLoan.equipmentId)?.name}</p>
                    <p><span className="font-medium">Código:</span> {equipment.find(eq => eq.id === selectedLoan.equipmentId)?.code}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Estudiante:</span> {users.find(u => u.id === selectedLoan.userId)?.name}</p>
                    <p><span className="font-medium">Fin preferido:</span> {new Date(selectedLoan.preferredEndDate).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del equipo al momento de la devolución *
                  </label>
                  <select
                    name="equipmentConditionOnReturn"
                    value={returnData.equipmentConditionOnReturn}
                    onChange={handleInputChange}
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
                    name="equipmentConditionNotes"
                    value={returnData.equipmentConditionNotes}
                    onChange={handleInputChange}
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
                    name="returnNotes"
                    value={returnData.returnNotes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Comentarios adicionales sobre la devolución..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="requiresMaintenance"
                    checked={returnData.requiresMaintenance}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    El equipo requiere mantenimiento antes del próximo préstamo
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Procesando...' : 'Procesar Devolución'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;