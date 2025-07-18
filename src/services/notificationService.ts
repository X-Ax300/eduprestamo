import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification } from '../types';

const COLLECTION_NAME = 'notifications';

export const createNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    // Filtrar campos undefined antes de enviar a Firestore
    const cleanNotification: any = {
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead || false,
      createdAt: Timestamp.fromDate(new Date())
    };

    // Solo agregar relatedLoanId si no es undefined
    if (notification.relatedLoanId !== undefined) {
      cleanNotification.relatedLoanId = notification.relatedLoanId;
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanNotification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    const notificationRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getNotificationsByUser = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const notifications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as Notification;
    });

    // Sort by createdAt in descending order on the client side
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting notifications by user:', error);
    throw error;
  }
};

export const subscribeToUserNotifications = (
  userId: string, 
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notifications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as Notification;
    });
    
    // Sort by createdAt in descending order on the client side
    const sortedNotifications = notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(sortedNotifications);
  });
};

// Utility function to create overdue notifications
export const createOverdueNotification = async (userId: string, equipmentName: string): Promise<void> => {
  await createNotification({
    userId,
    type: 'overdue',
    title: 'Préstamo Vencido',
    message: `El préstamo del equipo "${equipmentName}" ha vencido. Por favor, devuélvelo lo antes posible.`,
    isRead: false
  });
};

// Utility function to create approval notifications
export const createApprovalNotification = async (
  userId: string, 
  equipmentName: string, 
  approved: boolean
): Promise<void> => {
  await createNotification({
    userId,
    type: approved ? 'approved' : 'rejected',
    title: approved ? 'Préstamo Aprobado' : 'Préstamo Rechazado',
    message: approved 
      ? `Tu solicitud para el equipo "${equipmentName}" ha sido aprobada.`
      : `Tu solicitud para el equipo "${equipmentName}" ha sido rechazada.`,
    isRead: false
  });
};