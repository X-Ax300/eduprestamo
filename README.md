# EduPrestamo - Sistema de Préstamo de Equipos Tecnológicos

Sistema completo para la gestión de préstamos de equipos tecnológicos en instituciones educativas, desarrollado con React, TypeScript y Firebase.

## 🚀 Características

### Roles de Usuario
- **Estudiantes**: Solicitar préstamos de equipos
- **Docentes**: Supervisar estudiantes y aprobar préstamos
- **Administradores**: Gestión completa del sistema

### Funcionalidades Principales
- ✅ Sistema de autenticación con Firebase Auth
- ✅ **Administrador por defecto automático**
- ✅ Gestión de inventario de equipos
- ✅ Solicitudes y aprobación de préstamos
- ✅ Sistema de devoluciones con evaluación de estado
- ✅ Notificaciones automáticas
- ✅ Reportes y analytics
- ✅ Alertas de préstamos vencidos
- ✅ Dashboard personalizado por rol

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Iconos**: Lucide React
- **Routing**: React Router DOM
- **Fechas**: date-fns
- **Gráficos**: Recharts

## 📋 Configuración

### 1. Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication (Email/Password)
3. Crear base de datos Firestore
4. Obtener las credenciales de configuración

### 2. Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 3. Administrador por Defecto

🔐 **El sistema crea automáticamente un administrador por defecto:**

- **Email**: `admin@eduprestamo.com`
- **Contraseña**: `Admin123!`
- **Rol**: Administrador

**Características del sistema de administrador:**
- Se crea automáticamente al inicializar la aplicación
- Solo el administrador puede crear otros usuarios (docentes y administradores)
- Los estudiantes pueden auto-registrarse
- Si no existe administrador, solo se permite crear uno

### 4. Estructura de Firestore

El sistema creará automáticamente las siguientes colecciones:

- `users` - Información de usuarios
- `equipment` - Inventario de equipos
- `loans` - Préstamos activos e históricos
- `notifications` - Notificaciones del sistema

### 5. Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow unauthenticated users to query for admin users (needed for initial admin check)
    match /users {
      allow list: if request.auth == null && 
        request.query.where.role == 'admin';
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read all users
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Equipment - read for all authenticated, write for admin
    match /equipment/{equipmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Loans - users can read their own, teachers can read their students', admin can read all
    match /loans/{loanId} {
      allow read, write: if request.auth != null;
    }
    
    // Notifications - users can read their own
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### 6. Índices de Firestore Requeridos

Para el correcto funcionamiento del sistema, necesitas crear los siguientes índices compuestos en Firestore:

#### Índice para Notificaciones
- **Colección**: `notifications`
- **Campos**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Cómo crear el índice:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Firestore Database > Indexes
4. Haz clic en "Create Index"
5. Configura:
   - Collection ID: `notifications`
   - Field 1: `userId` (Ascending)
   - Field 2: `createdAt` (Descending)
6. Haz clic en "Create"

**Nota**: También puedes usar el enlace directo que aparece en el error de la consola para crear automáticamente el índice requerido.

## 🚀 Instalación y Uso

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🔐 Primer Uso del Sistema

1. **Configurar Firebase** con las credenciales en `.env`
2. **Configurar reglas de seguridad** en Firestore
3. **Crear índices requeridos** en Firestore
4. **Ejecutar la aplicación** - El administrador se crea automáticamente
5. **Iniciar sesión** con las credenciales del administrador por defecto
6. **Crear usuarios** docentes desde el panel de administrador
7. **Los estudiantes** pueden auto-registrarse

## 📱 Funcionalidades por Rol

### Estudiantes
- ✅ Auto-registro en el sistema
- ✅ Solicitar préstamos de equipos disponibles
- ✅ Ver historial de préstamos
- ✅ Recibir notificaciones de vencimientos
- ✅ Dashboard con estadísticas personales

### Docentes
- ✅ Registro solo por administrador
- ✅ Supervisar estudiantes asignados
- ✅ Aprobar/rechazar solicitudes de préstamo
- ✅ Ver reportes de sus estudiantes
- ✅ Gestionar devoluciones

### Administradores
- ✅ **Administrador por defecto creado automáticamente**
- ✅ Crear y gestionar todos los tipos de usuarios
- ✅ Administración completa de inventario
- ✅ Reportes globales del sistema
- ✅ Configuración de alertas y notificaciones
- ✅ Control total de préstamos y devoluciones

## 🔧 Desarrollo

### Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── Auth/           # Autenticación
│   ├── Dashboard/      # Dashboards por rol
│   └── Layout/         # Layout principal
├── context/            # Context API
├── services/           # Servicios Firebase
├── types/              # Tipos TypeScript
└── config/             # Configuración
```

### Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Linter ESLint

## 🔒 Seguridad

- **Autenticación Firebase** con email/password
- **Administrador por defecto** creado automáticamente
- **Control de roles** a nivel de base de datos
- **Validaciones de permisos** en todas las operaciones
- **Reglas de seguridad Firestore** configuradas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.