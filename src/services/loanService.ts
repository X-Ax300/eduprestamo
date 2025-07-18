import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Loan } from '../types';
import { updateEquipmentAvailability } from './equipmentService';

const COLLECTION_NAME = 'loans';

export const createLoan = async (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    
    // Verificar disponibilidad antes de crear el préstamo
    const equipmentRef = doc(db, 'equipment', loan.equipmentId);
    const equipmentDoc = await getDoc(equipmentRef);
    
    if (!equipmentDoc.exists()) {
      throw new Error('Equipment not found');
    }
    
    const equipmentData = equipmentDoc.data();
    const availableQuantity = equipmentData.availableQuantity || equipmentData.quantity || 0;
    
    if (availableQuantity <= 0) {
      throw new Error('No hay equipos disponibles');
    }
    
    // Ensure teacherId is properly set for loan tracking
    const loanDataWithTeacher = {
      ...loan,
      teacherId: loan.teacherId || null // Explicitly set to null if undefined
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...loanDataWithTeacher,
      requestDate: Timestamp.fromDate(loan.requestDate),
      approvedDate: loan.approvedDate ? Timestamp.fromDate(loan.approvedDate) : null,
      preferredStartDate: Timestamp.fromDate(loan.preferredStartDate),
      preferredEndDate: Timestamp.fromDate(loan.preferredEndDate),
      actualStartDate: loan.actualStartDate ? Timestamp.fromDate(loan.actualStartDate) : null,
      actualEndDate: loan.actualEndDate ? Timestamp.fromDate(loan.actualEndDate) : null,
      expectedReturnDate: Timestamp.fromDate(loan.expectedReturnDate),
      returnDate: loan.returnDate ? Timestamp.fromDate(loan.returnDate) : null,
      returnRequestDate: loan.returnRequestDate ? Timestamp.fromDate(loan.returnRequestDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw error;
  }
};

export const updateLoan = async (id: string, updates: Partial<Loan>): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const loanRef = doc(db, COLLECTION_NAME, id);
    
    // Obtener datos actuales del préstamo
    const loanDoc = await getDoc(loanRef);
    if (!loanDoc.exists()) {
      throw new Error('Loan not found');
    }
    
    const currentLoan = loanDoc.data();
    const equipmentId = currentLoan.equipmentId;
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    };

    // Convert dates to Timestamps
    if (updates.requestDate) {
      updateData.requestDate = Timestamp.fromDate(updates.requestDate);
    }
    if (updates.approvedDate) {
      updateData.approvedDate = Timestamp.fromDate(updates.approvedDate);
    }
    if (updates.preferredStartDate) {
      updateData.preferredStartDate = Timestamp.fromDate(updates.preferredStartDate);
    }
    if (updates.preferredEndDate) {
      updateData.preferredEndDate = Timestamp.fromDate(updates.preferredEndDate);
    }
    if (updates.actualStartDate) {
      updateData.actualStartDate = Timestamp.fromDate(updates.actualStartDate);
    }
    if (updates.actualEndDate) {
      updateData.actualEndDate = Timestamp.fromDate(updates.actualEndDate);
    }
    if (updates.expectedReturnDate) {
      updateData.expectedReturnDate = Timestamp.fromDate(updates.expectedReturnDate);
    }
    if (updates.returnDate) {
      updateData.returnDate = Timestamp.fromDate(updates.returnDate);
    }
    if (updates.returnRequestDate) {
      updateData.returnRequestDate = Timestamp.fromDate(updates.returnRequestDate);
    }

    batch.update(loanRef, updateData);

    // Manejar cambios en la disponibilidad del equipo
    if (updates.status) {
      const oldStatus = currentLoan.status;
      const newStatus = updates.status;
      
      // Si se aprueba un préstamo, reducir disponibilidad
      if (oldStatus === 'pending' && newStatus === 'approved') {
        await updateEquipmentAvailability(equipmentId, -1);
      }
      
      // Si se rechaza un préstamo que estaba aprobado, aumentar disponibilidad
      if (oldStatus === 'approved' && newStatus === 'rejected') {
        await updateEquipmentAvailability(equipmentId, 1);
      }
      
      // Si se devuelve un equipo, aumentar disponibilidad
      if ((oldStatus === 'active' || oldStatus === 'return_requested') && newStatus === 'returned') {
        await updateEquipmentAvailability(equipmentId, 1);
        
        // Actualizar condición del equipo si se especifica
        if (updates.equipmentConditionOnReturn) {
          const equipmentRef = doc(db, 'equipment', equipmentId);
          const equipmentUpdateData: any = {
            condition: updates.equipmentConditionOnReturn,
            updatedAt: Timestamp.fromDate(new Date())
          };
          
          // Si el equipo está dañado, cambiar su estado
          if (updates.equipmentConditionOnReturn === 'damaged') {
            equipmentUpdateData.status = 'damaged';
          } else {
            equipmentUpdateData.status = 'available';
          }
          
          batch.update(equipmentRef, equipmentUpdateData);
        }
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error updating loan:', error);
    throw error;
  }
};

export const getAllLoans = async (): Promise<Loan[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate.toDate(),
        approvedDate: data.approvedDate?.toDate() || undefined,
        preferredStartDate: data.preferredStartDate.toDate(),
        preferredEndDate: data.preferredEndDate.toDate(),
        actualStartDate: data.actualStartDate?.toDate() || undefined,
        actualEndDate: data.actualEndDate?.toDate() || undefined,
        expectedReturnDate: data.expectedReturnDate.toDate(),
        returnDate: data.returnDate?.toDate() || undefined,
        returnRequestDate: data.returnRequestDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Loan;
    });
  } catch (error) {
    console.error('Error getting loans:', error);
    throw error;
  }
};

export const getLoansByUser = async (userId: string): Promise<Loan[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate.toDate(),
        approvedDate: data.approvedDate?.toDate() || undefined,
        preferredStartDate: data.preferredStartDate.toDate(),
        preferredEndDate: data.preferredEndDate.toDate(),
        actualStartDate: data.actualStartDate?.toDate() || undefined,
        actualEndDate: data.actualEndDate?.toDate() || undefined,
        expectedReturnDate: data.expectedReturnDate.toDate(),
        returnDate: data.returnDate?.toDate() || undefined,
        returnRequestDate: data.returnRequestDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Loan;
    });
  } catch (error) {
    console.error('Error getting loans by user:', error);
    throw error;
  }
};

export const getLoansByTeacher = async (teacherId: string): Promise<Loan[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate.toDate(),
        approvedDate: data.approvedDate?.toDate() || undefined,
        preferredStartDate: data.preferredStartDate.toDate(),
        preferredEndDate: data.preferredEndDate.toDate(),
        actualStartDate: data.actualStartDate?.toDate() || undefined,
        actualEndDate: data.actualEndDate?.toDate() || undefined,
        expectedReturnDate: data.expectedReturnDate.toDate(),
        returnDate: data.returnDate?.toDate() || undefined,
        returnRequestDate: data.returnRequestDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Loan;
    });
  } catch (error) {
    console.error('Error getting loans by teacher:', error);
    throw error;
  }
};

export const getOverdueLoans = async (): Promise<Loan[]> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'active'),
      where('preferredEndDate', '<', Timestamp.fromDate(now))
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate.toDate(),
        approvedDate: data.approvedDate?.toDate() || undefined,
        preferredStartDate: data.preferredStartDate.toDate(),
        preferredEndDate: data.preferredEndDate.toDate(),
        actualStartDate: data.actualStartDate?.toDate() || undefined,
        actualEndDate: data.actualEndDate?.toDate() || undefined,
        expectedReturnDate: data.expectedReturnDate.toDate(),
        returnDate: data.returnDate?.toDate() || undefined,
        returnRequestDate: data.returnRequestDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Loan;
    });
  } catch (error) {
    console.error('Error getting overdue loans:', error);
    throw error;
  }
};

export const subscribeToLoans = (callback: (loans: Loan[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const loans = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate.toDate(),
        approvedDate: data.approvedDate?.toDate() || undefined,
        preferredStartDate: data.preferredStartDate.toDate(),
        preferredEndDate: data.preferredEndDate.toDate(),
        actualStartDate: data.actualStartDate?.toDate() || undefined,
        actualEndDate: data.actualEndDate?.toDate() || undefined,
        expectedReturnDate: data.expectedReturnDate.toDate(),
        returnDate: data.returnDate?.toDate() || undefined,
        returnRequestDate: data.returnRequestDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Loan;
    });
    callback(loans);
  });
};