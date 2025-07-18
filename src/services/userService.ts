import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';

const COLLECTION_NAME = 'users';

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as User;
    });
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

export const getUsersByRole = async (role: 'admin' | 'teacher' | 'student'): Promise<User[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as User;
    });
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

export const getStudentsByTeacher = async (teacherId: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('teacherId', '==', teacherId),
      where('role', '==', 'student')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as User;
    });
  } catch (error) {
    console.error('Error getting students by teacher:', error);
    throw error;
  }
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as User;
    });
    callback(users);
  });
};

export const subscribeToUsersByRole = (role: 'admin' | 'teacher' | 'student', callback: (users: User[]) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('role', '==', role)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      } as User;
    });
    // Sort by createdAt in descending order on the client side
    const sortedUsers = users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(sortedUsers);
  });
};