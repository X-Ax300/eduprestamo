import React, { useState } from 'react';
import { Package, Search, Filter, Plus, Calendar, User, X, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const EquipmentPage: React.FC = () => {
  const { equipment, loans, createLoan, users, addNotification } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [requestData, setRequestData] = useState({
    purpose: '',
    preferredStartDate: '',
    preferredEndDate: '',
    notes: ''
  });

  // Filtrar equipos disponibles basado en availableQuantity
  const availableEquipment = equipment.filter(eq => {
    return eq.status === 'available' && (eq.availableQuantity || 0) > 0;
  });
  
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(equipment.map(eq => eq.category))];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestLoan = (equipmentItem: any) => {
    const availableQuantity = equipmentItem.availableQuantity || 0;
    if (availableQuantity <= 0) {
      alert('Este equipo no está disponible en este momento');
      return;
    }
    
    setSelectedEquipment(equipmentItem);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!requestData.purpose || !requestData.preferredStartDate || !requestData.preferredEndDate) {
        throw new Error('El propósito, fecha de inicio y fecha de fin son obligatorios');
      }

      const startDate = new Date(requestData.preferredStartDate);
      const endDate = new Date(requestData.preferredEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new Error('La fecha de inicio no puede ser anterior a hoy');
      }

      if (endDate <= startDate) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Verificar disponibilidad una vez más antes de crear
      const availableQuantity = selectedEquipment.availableQuantity || 0;
      if (availableQuantity <= 0) {
        throw new Error('Este equipo ya no está disponible');
      }

      const loanData = {
        userId: user!.id,
        equipmentId: selectedEquipment.id,
        teacherId: user!.teacherId, // Always include teacherId if available
        requestDate: new Date(),
        preferredStartDate: startDate,
        preferredEndDate: endDate,
        expectedReturnDate: endDate,
        status: 'pending' as const,
        purpose: requestData.purpose,
        notes: requestData.notes
      };

      const loanId = await createLoan(loanData);
      
      // Crear notificación para el docente asignado
      if (user!.teacherId) {
        await addNotification({
          userId: user!.teacherId,
          type: 'pending',
          title: 'Nueva Solicitud de Préstamo',
          message: `Tu estudiante ${user!.name} ha solicitado el equipo "${selectedEquipment.name}". Revisa la solicitud en la página de aprobaciones.`,
          relatedLoanId: loanId
        });
      } else {
        // Si no tiene docente asignado, notificar a todos los administradores
        const admins = users.filter(u => u.role === 'admin');
        for (const admin of admins) {
          await addNotification({
            userId: admin.id,
            type: 'pending',
            title: 'Nueva Solicitud de Préstamo',
            message: `${user!.name} ha solicitado el equipo "${selectedEquipment.name}". Revisa la solicitud para aprobar o rechazar.`,
            relatedLoanId: loanId
          });
        }
      }
      
      setShowRequestModal(false);
      setSelectedEquipment(null);
      setRequestData({
        purpose: '',
        preferredStartDate: '',
        preferredEndDate: '',
        notes: ''
      });
      
      alert('Solicitud de préstamo enviada exitosamente');
    } catch (err: any) {
      console.error('Error al enviar solicitud:', err);
      setError(err.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setSelectedEquipment(null);
    setRequestData({
      purpose: '',
      preferredStartDate: '',
      preferredEndDate: '',
      notes: ''
    });
    setError('');
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = {
      excellent: { color: 'bg-green-100 text-green-800', text: 'Excelente' },
      good: { color: 'bg-blue-100 text-blue-800', text: 'Bueno' },
      fair: { color: 'bg-yellow-100 text-yellow-800', text: 'Regular' },
      poor: { color: 'bg-red-100 text-red-800', text: 'Malo' }
    };
    
    const config = conditionConfig[condition as keyof typeof conditionConfig] || conditionConfig.good;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getAvailabilityBadge = (item: any) => {
    const available = item.availableQuantity || 0;
    const total = item.quantity || 1;
    
    if (available > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Disponible ({available}/{total})
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          No disponible (0/{total})
        </span>
      );
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipos Disponibles</h1>
          <p className="text-gray-600 dark:text-white">Solicita préstamos de equipos tecnológicos</p>
          {user?.teacherId && (
            <p className="text-sm text-blue-600 mt-1 dark:text-blue-400">
              Tus solicitudes serán enviadas a tu docente asignado para aprobación
            </p>
          )}
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
                placeholder="Buscar por nombre, marca o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-150 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipos Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{availableEquipment.length}</p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resultados</p>
              <p className="text-2xl font-bold text-gray-900">{filteredEquipment.length}</p>
            </div>
            <Package className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Grid de equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => {
          const available = item.availableQuantity || 0;
          const total = item.quantity || 1;
          const isAvailable = item.status === 'available' && available > 0;
          
          return (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow dark:bg-gray-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.brand} {item.model}</p>
                  </div>
                  <div className="ml-4 space-y-1">
                    {getConditionBadge(item.condition)}
                    {getAvailabilityBadge(item)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Código:</span>
                    <span className="font-medium text-gray-900">{item.code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Categoría:</span>
                    <span className="font-medium text-gray-900">{item.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ubicación:</span>
                    <span className="font-medium text-gray-900">{item.location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Disponibles:</span>
                    <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {available} de {total}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                )}

                {!isAvailable && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">
                        {available === 0 ? 'No hay unidades disponibles' : 'Equipo no disponible'}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleRequestLoan(item)}
                  disabled={!isAvailable}
                  className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    isAvailable
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAvailable ? 'Solicitar Préstamo' : 'No Disponible'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron equipos</h3>
          <p className="text-gray-500">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay equipos disponibles en este momento'
            }
          </p>
        </div>
      )}

      {/* Modal para solicitar préstamo */}
      {showRequestModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Solicitar Préstamo</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Información del equipo */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">{selectedEquipment.name}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Marca:</span> {selectedEquipment.brand} {selectedEquipment.model}</p>
                  <p><span className="font-medium">Código:</span> {selectedEquipment.code}</p>
                  <p><span className="font-medium">Ubicación:</span> {selectedEquipment.location}</p>
                  <p><span className="font-medium">Disponibles:</span> {selectedEquipment.availableQuantity || 0}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propósito del préstamo *
                  </label>
                  <input
                    type="text"
                    name="purpose"
                    value={requestData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Proyecto de clase, presentación, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio preferida *
                  </label>
                  <input
                    type="date"
                    name="preferredStartDate"
                    value={requestData.preferredStartDate}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de devolución preferida *
                  </label>
                  <input
                    type="date"
                    name="preferredEndDate"
                    value={requestData.preferredEndDate}
                    onChange={handleInputChange}
                    min={requestData.preferredStartDate || getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    name="notes"
                    value={requestData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Información adicional sobre el uso del equipo..."
                  />
                </div>

                {!user?.teacherId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> No tienes un docente asignado. La solicitud será enviada directamente a los administradores.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{loading ? 'Enviando...' : 'Enviar Solicitud'}</span>
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

export default EquipmentPage;