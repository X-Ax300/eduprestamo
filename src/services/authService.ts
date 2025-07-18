import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

// Función para verificar si existe un administrador
const checkAdminExists = async (): Promise<boolean> => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking admin existence:', error);
    return false;
  }
};

export const createUser = async (
  email: string, 
  password: string, 
  userData: Omit<User, 'id' | 'createdAt'>
): Promise<User> => {
  try {
    // Verificar si existe un administrador en el sistema
    const adminExists = await checkAdminExists();
    
    if (!adminExists && userData.role !== 'admin') {
      throw new Error('Debe existir un administrador en el sistema antes de crear otros usuarios');
    }

    // Si hay admin y se intenta crear un usuario que no es estudiante, verificar permisos
    if (adminExists && userData.role !== 'student') {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Debe estar autenticado para crear usuarios');
      }

      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
        throw new Error('Solo los administradores pueden crear usuarios docentes y administradores');
      }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, {
      displayName: userData.name
    });

    const newUser: User = {
      id: firebaseUser.uid,
      ...userData,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...newUser,
      createdAt: newUser.createdAt.toISOString()
    });

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const signInUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Datos de usuario no encontrados en la base de datos');
    }

    const userData = userDoc.data();
    
    // Validar que el usuario esté activo
    if (!userData.isActive) {
      throw new Error('Usuario inactivo. Contacte al administrador');
    }

    return {
      ...userData,
      id: firebaseUser.uid,
      createdAt: new Date(userData.createdAt)
    } as User;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.error('User document not found in Firestore');
      return null;
    }

    const userData = userDoc.data();
    
    // Validar que el usuario esté activo
    if (!userData.isActive) {
      console.error('User is inactive');
      return null;
    }

    return {
      ...userData,
      id: firebaseUser.uid,
      createdAt: new Date(userData.createdAt)
    } as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Función para verificar si el administrador existe (para uso en componentes)
export const checkIfAdminExists = async (): Promise<boolean> => {
  return await checkAdminExists();
};