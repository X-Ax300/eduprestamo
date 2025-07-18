import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
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
import { Equipment } from '../types';

const COLLECTION_NAME = 'equipment';

export const addEquipment = async (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...equipment,
      // Si no se especifica availableQuantity, usar quantity
      availableQuantity: equipment.availableQuantity || equipment.quantity,
      purchaseDate: Timestamp.fromDate(equipment.purchaseDate),
      lastMaintenanceDate: equipment.lastMaintenanceDate ? Timestamp.fromDate(equipment.lastMaintenanceDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding equipment:', error);
    throw error;
  }
};

export const updateEquipment = async (id: string, updates: Partial<Equipment>): Promise<void> => {
  try {
    const equipmentRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    };

    // Convert dates to Timestamps
    if (updates.purchaseDate) {
      updateData.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
    }
    if (updates.lastMaintenanceDate) {
      updateData.lastMaintenanceDate = Timestamp.fromDate(updates.lastMaintenanceDate);
    }

    await updateDoc(equipmentRef, updateData);
  } catch (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
};

export const updateEquipmentAvailability = async (equipmentId: string, change: number): Promise<void> => {
  try {
    const equipmentRef = doc(db, COLLECTION_NAME, equipmentId);
    const equipmentDoc = await getDoc(equipmentRef);
    
    if (!equipmentDoc.exists()) {
      throw new Error('Equipment not found');
    }
    
    const currentData = equipmentDoc.data();
    const currentAvailable = currentData.availableQuantity || currentData.quantity || 0;
    const newAvailable = Math.max(0, currentAvailable + change);
    
    await updateDoc(equipmentRef, {
      availableQuantity: newAvailable,
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error updating equipment availability:', error);
    throw error;
  }
};

export const deleteEquipment = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting equipment:', error);
    throw error;
  }
};

export const getAllEquipment = async (): Promise<Equipment[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Asegurar que availableQuantity existe
        availableQuantity: data.availableQuantity !== undefined ? data.availableQuantity : data.quantity,
        purchaseDate: data.purchaseDate.toDate(),
        lastMaintenanceDate: data.lastMaintenanceDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Equipment;
    });
  } catch (error) {
    console.error('Error getting equipment:', error);
    throw error;
  }
};

export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        availableQuantity: data.availableQuantity !== undefined ? data.availableQuantity : data.quantity,
        purchaseDate: data.purchaseDate.toDate(),
        lastMaintenanceDate: data.lastMaintenanceDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Equipment;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting equipment by ID:', error);
    throw error;
  }
};

export const getAvailableEquipment = async (): Promise<Equipment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'available'),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        availableQuantity: data.availableQuantity !== undefined ? data.availableQuantity : data.quantity,
        purchaseDate: data.purchaseDate.toDate(),
        lastMaintenanceDate: data.lastMaintenanceDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Equipment;
    }).filter(eq => (eq.availableQuantity || 0) > 0);
  } catch (error) {
    console.error('Error getting available equipment:', error);
    throw error;
  }
};

export const subscribeToEquipment = (callback: (equipment: Equipment[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const equipment = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        availableQuantity: data.availableQuantity !== undefined ? data.availableQuantity : data.quantity,
        purchaseDate: data.purchaseDate.toDate(),
        lastMaintenanceDate: data.lastMaintenanceDate?.toDate() || undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Equipment;
    });
    callback(equipment);
  });
};