export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  cedula?: string;
  matricula?: string;
  teacherId?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  code: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: 'available' | 'loaned' | 'damaged' | 'maintenance';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  quantity: number; // Cantidad total de equipos
  availableQuantity: number; // Cantidad disponible para préstamo
  purchaseDate: Date;
  lastMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  userId: string;
  equipmentId: string;
  teacherId?: string;
  requestDate: Date;
  approvedDate?: Date;
  preferredStartDate: Date;
  preferredEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  expectedReturnDate: Date;
  returnDate?: Date;
  returnRequestDate?: Date;
  status: 'pending' | 'approved' | 'active' | 'return_requested' | 'returned' | 'overdue' | 'rejected';
  purpose: string;
  notes?: string;
  returnNotes?: string;
  equipmentConditionOnReturn?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  equipmentConditionNotes?: string;
  processedBy?: string;
  approvedBy?: string;
  returnProcessedBy?: string;
  returnApprovedBy?: string; // Nuevo: quien aprobó la devolución
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'overdue' | 'approved' | 'rejected' | 'damaged' | 'reminder' | 'return_request' | 'return_processed' | 'pending' | 'return_approved';
  title: string;
  message: string;
  isRead: boolean;
  relatedLoanId?: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  type: 'loans' | 'equipment' | 'users' | 'overdue';
  title: string;
  data: any;
  generatedBy: string;
  createdAt: Date;
}