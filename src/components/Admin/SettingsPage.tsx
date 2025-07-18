import React, { useState } from 'react';
import { Settings, Save, Bell, Mail, Shield, Database, Clock, AlertTriangle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    // Configuración de notificaciones
    notifications: {
      emailNotifications: true,
      overdueReminders: true,
      approvalNotifications: true,
      returnReminders: true,
      reminderDaysBefore: 2
    },
    // Configuración de préstamos
    loans: {
      maxLoanDuration: 30,
      maxActiveLoans: 3,
      requireTeacherApproval: true,
      autoApproveReturns: false,
      allowWeekendLoans: false
    },
    // Configuración de sistema
    system: {
      maintenanceMode: false,
      allowSelfRegistration: true,
      requireEmailVerification: false,
      sessionTimeout: 60,
      backupFrequency: 'daily'
    },
    // Configuración de equipos
    equipment: {
      autoMarkDamaged: false,
      requireConditionCheck: true,
      allowPartialReturns: false,
      trackMaintenanceSchedule: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aquí se guardarían las configuraciones en Firebase
      console.log('Saving settings:', settings);
      
      setSuccess('Configuración guardada exitosamente');
    } catch (err: any) {
      setError('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const SettingSection: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, description, icon, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const ToggleSwitch: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const NumberInput: React.FC<{
    label: string;
    description?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    suffix?: string;
  }> = ({ label, description, value, onChange, min = 0, max = 999, suffix }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          min={min}
          max={max}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );

  const SelectInput: React.FC<{
    label: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }> = ({ label, description, value, onChange, options }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Administra las configuraciones globales del sistema</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Guardando...' : 'Guardar Configuración'}</span>
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Notificaciones */}
        <SettingSection
          title="Notificaciones"
          description="Configura cómo y cuándo se envían las notificaciones"
          icon={<Bell className="w-5 h-5 text-blue-600" />}
        >
          <ToggleSwitch
            label="Notificaciones por Email"
            description="Enviar notificaciones importantes por correo electrónico"
            checked={settings.notifications.emailNotifications}
            onChange={(checked) => handleInputChange('notifications', 'emailNotifications', checked)}
          />
          <ToggleSwitch
            label="Recordatorios de Vencimiento"
            description="Notificar cuando los préstamos estén próximos a vencer"
            checked={settings.notifications.overdueReminders}
            onChange={(checked) => handleInputChange('notifications', 'overdueReminders', checked)}
          />
          <ToggleSwitch
            label="Notificaciones de Aprobación"
            description="Notificar cuando se aprueben o rechacen solicitudes"
            checked={settings.notifications.approvalNotifications}
            onChange={(checked) => handleInputChange('notifications', 'approvalNotifications', checked)}
          />
          <NumberInput
            label="Días de Anticipación"
            description="Días antes del vencimiento para enviar recordatorios"
            value={settings.notifications.reminderDaysBefore}
            onChange={(value) => handleInputChange('notifications', 'reminderDaysBefore', value)}
            min={1}
            max={7}
            suffix="días"
          />
        </SettingSection>

        {/* Configuración de Préstamos */}
        <SettingSection
          title="Préstamos"
          description="Configura las reglas y límites para los préstamos"
          icon={<Clock className="w-5 h-5 text-blue-600" />}
        >
          <NumberInput
            label="Duración Máxima de Préstamo"
            description="Número máximo de días para un préstamo"
            value={settings.loans.maxLoanDuration}
            onChange={(value) => handleInputChange('loans', 'maxLoanDuration', value)}
            min={1}
            max={365}
            suffix="días"
          />
          <NumberInput
            label="Préstamos Activos Máximos"
            description="Número máximo de préstamos activos por estudiante"
            value={settings.loans.maxActiveLoans}
            onChange={(value) => handleInputChange('loans', 'maxActiveLoans', value)}
            min={1}
            max={10}
            suffix="préstamos"
          />
          <ToggleSwitch
            label="Requiere Aprobación de Docente"
            description="Los préstamos deben ser aprobados por el docente asignado"
            checked={settings.loans.requireTeacherApproval}
            onChange={(checked) => handleInputChange('loans', 'requireTeacherApproval', checked)}
          />
          <ToggleSwitch
            label="Permitir Préstamos en Fin de Semana"
            description="Permitir solicitar préstamos durante fines de semana"
            checked={settings.loans.allowWeekendLoans}
            onChange={(checked) => handleInputChange('loans', 'allowWeekendLoans', checked)}
          />
        </SettingSection>

        {/* Configuración del Sistema */}
        <SettingSection
          title="Sistema"
          description="Configuraciones generales del sistema"
          icon={<Shield className="w-5 h-5 text-blue-600" />}
        >
          <ToggleSwitch
            label="Modo Mantenimiento"
            description="Activar modo mantenimiento (solo administradores pueden acceder)"
            checked={settings.system.maintenanceMode}
            onChange={(checked) => handleInputChange('system', 'maintenanceMode', checked)}
          />
          <ToggleSwitch
            label="Permitir Auto-registro"
            description="Los estudiantes pueden registrarse automáticamente"
            checked={settings.system.allowSelfRegistration}
            onChange={(checked) => handleInputChange('system', 'allowSelfRegistration', checked)}
          />
          <NumberInput
            label="Tiempo de Sesión"
            description="Tiempo en minutos antes de cerrar sesión automáticamente"
            value={settings.system.sessionTimeout}
            onChange={(value) => handleInputChange('system', 'sessionTimeout', value)}
            min={15}
            max={480}
            suffix="minutos"
          />
          <SelectInput
            label="Frecuencia de Respaldo"
            description="Con qué frecuencia realizar respaldos automáticos"
            value={settings.system.backupFrequency}
            onChange={(value) => handleInputChange('system', 'backupFrequency', value)}
            options={[
              { value: 'daily', label: 'Diario' },
              { value: 'weekly', label: 'Semanal' },
              { value: 'monthly', label: 'Mensual' }
            ]}
          />
        </SettingSection>

        {/* Configuración de Equipos */}
        <SettingSection
          title="Equipos"
          description="Configuraciones relacionadas con la gestión de equipos"
          icon={<Database className="w-5 h-5 text-blue-600" />}
        >
          <ToggleSwitch
            label="Verificación de Condición Obligatoria"
            description="Requerir verificación del estado del equipo en cada devolución"
            checked={settings.equipment.requireConditionCheck}
            onChange={(checked) => handleInputChange('equipment', 'requireConditionCheck', checked)}
          />
          <ToggleSwitch
            label="Seguimiento de Mantenimiento"
            description="Activar recordatorios de mantenimiento programado"
            checked={settings.equipment.trackMaintenanceSchedule}
            onChange={(checked) => handleInputChange('equipment', 'trackMaintenanceSchedule', checked)}
          />
          <ToggleSwitch
            label="Marcar Automáticamente como Dañado"
            description="Marcar equipos como dañados si se devuelven en mal estado"
            checked={settings.equipment.autoMarkDamaged}
            onChange={(checked) => handleInputChange('equipment', 'autoMarkDamaged', checked)}
          />
        </SettingSection>
      </div>

      {/* Información del Sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gray-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Información del Sistema</h3>
            <p className="text-sm text-gray-600">Detalles técnicos y estado del sistema</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Versión:</span>
            <span className="ml-2 text-gray-600">1.0.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Último Respaldo:</span>
            <span className="ml-2 text-gray-600">{new Date().toLocaleDateString('es-ES')}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Estado:</span>
            <span className="ml-2 text-green-600">Operativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;