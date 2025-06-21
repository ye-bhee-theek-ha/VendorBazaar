// src/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  limit,
  startAfter,
  getDocs,
  writeBatch,
  doc,
  DocumentData,
  QueryDocumentSnapshot,
  documentId,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { Notification } from "../constants/types.user";

// --- Interfaces ---
interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  unreadCount: number;
  hasMore: boolean;
  loadMoreNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: ({ id }: { id: string }) => Promise<void>;
}

// --- Context Definition ---
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const NOTIFICATIONS_PER_PAGE = 20;

// --- Provider Component ---
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const notificationsCollectionRef = collection(db, "notifications");
    const q = query(
      notificationsCollectionRef,
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  const fetchInitialNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasMore(true);

    try {
      const notificationsCollectionRef = collection(db, "notifications");
      const q = query(
        notificationsCollectionRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(NOTIFICATIONS_PER_PAGE)
      );

      const documentSnapshots = await getDocs(q);
      console.log("notifications: ", documentSnapshots.size);
      console.log(user.email);
      const notificationList = documentSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      setNotifications(notificationList);

      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc);

      if (documentSnapshots.docs.length < NOTIFICATIONS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialNotifications();
  }, [fetchInitialNotifications]);

  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore || !lastVisible || !user) return;

    setLoadingMore(true);
    try {
      const notificationsCollectionRef = collection(db, "notifications");
      const q = query(
        notificationsCollectionRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(NOTIFICATIONS_PER_PAGE)
      );
      const documentSnapshots = await getDocs(q);
      const newNotificationList = documentSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      setNotifications((prev) => [...prev, ...newNotificationList]);

      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc);

      if (documentSnapshots.docs.length < NOTIFICATIONS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more notifications:", err);
      setError("Could not load more.");
    } finally {
      setLoadingMore(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    const updatedNotifications = notifications.map((n) => ({
      ...n,
      read: true,
    }));
    setNotifications(updatedNotifications);

    try {
      const notificationsCollectionRef = collection(db, "notifications");
      const q = query(
        notificationsCollectionRef,
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
      setNotifications(notifications);
    }
  };

  const markAsRead = async ({ id }: { id: string }) => {
    console.log("Marking notification as read:", id);
    if (!user || unreadCount === 0) return;

    const notification = notifications.find((n) => n.id === id);
    if (notification?.read) return;

    const previousNotifications = [...notifications];

    const updatedNotifications = notifications.map((item) =>
      item.id == id ? { ...item, read: true } : item
    );

    console.log("Updated notifications:", updatedNotifications);

    setNotifications(updatedNotifications);

    try {
      const notificationsCollectionRef = collection(db, "notifications");
      const q = query(
        notificationsCollectionRef,
        where(documentId(), "==", id),
        where("read", "==", false)
      );
      const snapshot = await getDocs(q);

      console.log(snapshot.docs.length, "notifications found to update");

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setNotifications(previousNotifications);
    }
  };

  const value = {
    notifications,
    loading,
    loadingMore,
    error,
    unreadCount,
    hasMore,
    loadMoreNotifications,
    markAllAsRead,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
