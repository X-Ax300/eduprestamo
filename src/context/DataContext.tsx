import React, { createContext, useContext, useState, useEffect } from 'react';
import { Equipment, Loan, Notification, User } from '../types';
import { useAuth } from './AuthContext';
import { 
  subscribeToEquipment, 
  addEquipment as addEquipmentService,
  updateEquipment as updateEquipmentService,
  deleteEquipment as deleteEquipmentService
} from '../services/equipmentService';
import { 
  subscribeToLoans,
  createLoan as createLoanService,
  updateLoan as updateLoanService
} from '../services/loanService';
import { 
  subscribeToUserNotifications,
  createNotification as createNotificationService,
  markNotificationAsRead as markNotificationAsReadService
} from '../services/notificationService';
import {
  subscribeToUsers,
  updateUser as updateUserService,
  deleteUser as deleteUserService
} from '../services/userService';

interface DataContextType {
  equipment: Equipment[];
  loans: Loan[];
  notifications: Notification[];
  users: User[];
  loading: boolean;
  addEquipment: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  createLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateLoan: (id: string, updates: Partial<Loan>) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setEquipment([]);
      setLoans([]);
      setNotifications([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to equipment changes
    const unsubscribeEquipment = subscribeToEquipment((equipmentData) => {
      setEquipment(equipmentData);
    });

    // Subscribe to loans changes
    const unsubscribeLoans = subscribeToLoans((loansData) => {
      setLoans(loansData);
    });

    // Subscribe to user notifications
    const unsubscribeNotifications = subscribeToUserNotifications(user.id, (notificationsData) => {
      setNotifications(notificationsData);
    });

    // Subscribe to users (only for admin and teachers)
    let unsubscribeUsers = () => {};
    if (user.role === 'admin' || user.role === 'teacher') {
      unsubscribeUsers = subscribeToUsers((usersData) => {
        setUsers(usersData);
      });
    }

    setLoading(false);

    return () => {
      unsubscribeEquipment();
      unsubscribeLoans();
      unsubscribeNotifications();
      unsubscribeUsers();
    };
  }, [isAuthenticated, user]);

  const addEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addEquipmentService(equipmentData);
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error;
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      await updateEquipmentService(id, updates);
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      await deleteEquipmentService(id);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  };

  const createLoan = async (loanData: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      return await createLoanService(loanData);
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  };

  const updateLoan = async (id: string, updates: Partial<Loan>) => {
    try {
      await updateLoanService(id, updates);
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  };

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      await createNotificationService(notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await markNotificationAsReadService(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      await updateUserService(id, updates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteUserService(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      equipment,
      loans,
      notifications,
      users,
      loading,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      createLoan,
      updateLoan,
      addNotification,
      markNotificationAsRead,
      updateUser,
      deleteUser
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};