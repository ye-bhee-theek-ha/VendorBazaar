// src/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { Notification } from "../constants/types.user";
import { registerForPushNotificationsAsync } from "@/src/utils/registerForPushNotificationsAsync";
import { Platform } from "react-native";

// --- Interfaces ---
interface NotificationContextType {
  // Firestore notifications
  notifications: Notification[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  unreadCount: number;
  hasMore: boolean;
  loadMoreNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: ({ id }: { id: string }) => Promise<void>;

  // Push notifications
  expoPushToken: string | null;
  pushNotification: Notifications.Notification | null;
  pushNotificationError: Error | null;
  tokenSaving: boolean;
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
  const { user, ReFetchUser } = useAuth();

  // Firestore notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Push notification states
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [pushNotification, setPushNotification] =
    useState<Notifications.Notification | null>(null);
  const [pushNotificationError, setPushNotificationError] =
    useState<Error | null>(null);
  const [tokenSaving, setTokenSaving] = useState(false);

  // Push notification listeners
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const savePushTokenToDatabase = async (token: string) => {
    if (!user || !token) {
      console.log("Cannot save token: No user or token");
      return;
    }

    setTokenSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);

      // First, check if the token is already saved to avoid unnecessary writes
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const existingToken = userData.pushToken;

        if (existingToken === token) {
          console.log("Push token already exists in database, skipping update");
          setTokenSaving(false);
          return;
        }
      }

      // Update user document with new push token
      await updateDoc(userDocRef, {
        pushToken: token,
        pushTokenUpdatedAt: serverTimestamp(),
        platform: Platform.OS,
      });

      console.log("Push token saved to database successfully");

      // Refresh user data to sync with AuthContext
      await ReFetchUser();
    } catch (error) {
      console.error(" Failed to save push token to database:", error);
      setPushNotificationError(new Error("Failed to save push token"));
    } finally {
      setTokenSaving(false);
    }
  };

  // Initialize push notifications and save token
  useEffect(() => {
    if (!user) {
      console.log("No user logged in, skipping push notification setup");
      return;
    }

    const setupPushNotifications = async () => {
      try {
        console.log("Setting up push notifications for user:", user.email);

        // Register for push notifications and get token
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
        console.log("Expo push token received:", token);

        // Save token to database
        await savePushTokenToDatabase(token);
      } catch (error) {
        console.error("Push notification setup failed:", error);
        setPushNotificationError(error as Error);
      }
    };

    setupPushNotifications();

    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Push Notification Received: ", notification);
        setPushNotification(notification);

        // Optionally refresh Firestore notifications if the push notification
        // indicates new data is available
        const data = notification.request.content.data;
        if (data?.refreshNotifications) {
          fetchInitialNotifications();
        }
      });

    // Handle notification responses (when user taps notification)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Push Notification Response: ", response);

        // Handle navigation or other actions based on notification data
        const data = response.notification.request.content.data;
        if (data?.notificationId) {
          // Mark specific notification as read
          markAsRead({ id: data.notificationId as string });
        }

        // Clear the notification from state
        setPushNotification(null);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  // Monitor unread count for Firestore notifications
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
      console.log("Firestore notifications: ", documentSnapshots.size);

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

    setNotifications(updatedNotifications);

    try {
      const notificationsCollectionRef = collection(db, "notifications");
      const q = query(
        notificationsCollectionRef,
        where(documentId(), "==", id),
        where("read", "==", false)
      );
      const snapshot = await getDocs(q);

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
    // Firestore notifications
    notifications,
    loading,
    loadingMore,
    error,
    unreadCount,
    hasMore,
    loadMoreNotifications,
    markAllAsRead,
    markAsRead,

    // Push notifications
    expoPushToken,
    pushNotification,
    pushNotificationError,
    tokenSaving,
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
