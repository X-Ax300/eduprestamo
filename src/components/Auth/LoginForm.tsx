import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Mail, Shield, AlertCircle } from 'lucide-react';
import { checkIfAdminExists } from '../../services/authService';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const { login } = useAuth();

  // Verificar si existe un administrador
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const exists = await checkIfAdminExists();
        setAdminExists(exists);
      } catch (error) {
        console.error('Error checking admin:', error);
        setAdminExists(false);
      }
    };

    checkAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Credenciales incorrectas. Verifique sus datos.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (adminExists === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">EP</span>
          </div>
          <p className="text-gray-600">Verificando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">EP</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">EduPrestamo</h2>
          <p className="mt-2 text-gray-600">Sistema de Préstamo de Equipos Tecnológicos</p>
        </div>

        {/* Estado del sistema */}
        <div className={`rounded-lg p-4 ${adminExists ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center">
            {adminExists ? (
              <Shield className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
            )}
            <div>
              <h3 className={`text-sm font-medium ${adminExists ? 'text-green-800' : 'text-amber-800'}`}>
                {adminExists ? 'Sistema Configurado' : 'Sistema sin Administrador'}
              </h3>
              <p className={`text-xs mt-1 ${adminExists ? 'text-green-700' : 'text-amber-700'}`}>
                {adminExists 
                  ? 'El administrador está configurado correctamente'
                  : 'Debe configurar un administrador en Firebase primero'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Iniciar Sesión</h3>
            <p className="text-sm text-gray-500 mt-1">Accede a tu cuenta del sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu.email@edu.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu contraseña"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Instrucciones para configurar admin */}
        {!adminExists && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📋 Configuración Inicial Requerida
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>Para usar el sistema, primero debe configurar un administrador en Firebase:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Acceda a Firebase Console</li>
                <li>Vaya a Authentication → Users</li>
                <li>Agregue un usuario manualmente</li>
                <li>En Firestore, cree un documento en la colección 'users' con role: 'admin'</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;