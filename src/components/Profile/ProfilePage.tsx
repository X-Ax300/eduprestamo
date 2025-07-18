import React, { useState } from 'react';
import { User, Save, Lock, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { updateUser, users } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    cedula: user?.cedula || '',
    matricula: user?.matricula || '',
    teacherId: user?.teacherId || ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const teachers = users.filter(u => u.role === 'teacher');

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!profileData.name || !profileData.email) {
        throw new Error('El nombre y email son obligatorios');
      }

      const updates: any = {
        name: profileData.name,
        email: profileData.email
      };

      if (user?.role === 'teacher' && profileData.cedula) {
        updates.cedula = profileData.cedula;
      }

      if (user?.role === 'student') {
        if (profileData.matricula) {
          updates.matricula = profileData.matricula;
        }
        if (profileData.teacherId) {
          updates.teacherId = profileData.teacherId;
        }
      }

      await updateUser(user!.id, updates);
      setSuccess('Perfil actualizado exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error('Todos los campos de contraseña son obligatorios');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas nuevas no coinciden');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      if (passwordData.newPassword === passwordData.currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      await updatePassword(currentUser, passwordData.newPassword);
      
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Contraseña actualizada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Docente';
      case 'student': return 'Estudiante';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-300">Mi Perfil</h1>
          <p className="text-gray-600 dark:text-gray-300">Gestiona tu información personal y configuración</p>
        </div>
      </div>

      {/* Información básica */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{getRoleName(user?.role || '')}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Información Personal</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Rol:</span> {getRoleName(user?.role || '')}</p>
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              {user?.role === 'teacher' && user?.cedula && (
                <p><span className="font-medium">Cédula:</span> {user.cedula}</p>
              )}
              {user?.role === 'student' && user?.matricula && (
                <p><span className="font-medium">Matrícula:</span> {user.matricula}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Información del Sistema</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Fecha de registro:</span> {user?.createdAt.toLocaleDateString('es-ES')}</p>
              <p><span className="font-medium">Estado:</span> {user?.isActive ? 'Activo' : 'Inactivo'}</p>
              {user?.role === 'student' && user?.teacherId && (
                <p><span className="font-medium">Docente asignado:</span> {
                  teachers.find(t => t.id === user.teacherId)?.name || 'No encontrado'
                }</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de edición */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 dark:bg-gray-300 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Editar Información</h3>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Lock className="w-4 h-4" />
            <span>Cambiar Contraseña</span>
          </button>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-150 transition-colors"
                required
              />
            </div>

            {user?.role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula
                </label>
                <input
                  type="text"
                  name="cedula"
                  value={profileData.cedula}
                  onChange={handleProfileInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
            )}

            {user?.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    name="matricula"
                    value={profileData.matricula}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
              <button
                onClick={handleClosePasswordModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña actual *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nueva contraseña *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Cambiando...' : 'Cambiar Contraseña'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;