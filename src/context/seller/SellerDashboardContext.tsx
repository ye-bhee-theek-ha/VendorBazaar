// src/context/seller/SellerDashboardContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../AuthContext";
import { Review } from "../../constants/types.product"; // Re-using Review type
import { Order } from "../../constants/types.order";

// --- Interfaces ---
interface DashboardMetrics {
  salesToday: number;
  newOrders: number;
  unreadMessages: number; // This will be a placeholder for Supabase data
}

interface ActivityItem {
  id: string;
  type: "order" | "review";
  title: string;
  subtitle: string;
  amount?: number;
  createdAt: Timestamp;
}

interface SellerDashboardContextType {
  metrics: DashboardMetrics;
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

// --- Context Definition ---
const SellerDashboardContext = createContext<
  SellerDashboardContextType | undefined
>(undefined);

// --- Provider Component ---
export function SellerDashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    salesToday: 0,
    newOrders: 0,
    unreadMessages: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "seller") {
      setLoading(false);
      return;
    }

    setLoading(true);

    // --- Data Fetching from Firebase ---

    // 1. Fetch recent orders for activity feed and metrics
    const ordersRef = collection(db, "orders"); // Assuming a top-level orders collection
    const ordersQuery = query(
      ordersRef,
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10) // Get the 10 most recent orders for the activity feed
    );

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let salesToday = 0;
        const newOrders = snapshot.docs.filter(
          (doc) =>
            doc.data().status === "New" || doc.data().status === "Processing"
        ).length;

        const orderActivities = snapshot.docs.map((doc) => {
          const orderData = doc.data() as Order;
          const orderDate = orderData.createdAt.toDate();
          if (orderDate >= today) {
            salesToday += orderData.total;
          }
          return {
            id: doc.id,
            type: "order",
            title: `New Order #${doc.id.substring(0, 6)}`,
            subtitle: `Total: $${orderData.total.toFixed(2)}`,
            amount: orderData.total,
            createdAt: orderData.createdAt,
          } as ActivityItem;
        });

        setMetrics((prev) => ({ ...prev, salesToday, newOrders }));
        setActivities((prev) =>
          [...orderActivities, ...prev.filter((a) => a.type !== "order")].sort(
            (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
          )
        );
      },
      (err) => {
        console.error("Failed to fetch seller orders:", err);
        setError("Could not load order data.");
      }
    );

    // 2. Fetch recent reviews for activity feed
    const reviewsRef = collection(db, "reviews");
    const reviewsQuery = query(
      reviewsRef,
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewActivities = snapshot.docs.map((doc) => {
        const reviewData = doc.data() as Review;
        return {
          id: doc.id,
          type: "review",
          title: `${reviewData.userName} left a ${reviewData.rating}-star review`,
          subtitle: `"${reviewData.text.substring(0, 40)}..."`,
          createdAt: reviewData.createdAt,
        } as ActivityItem;
      });
      setActivities((prev) =>
        [...reviewActivities, ...prev.filter((a) => a.type !== "review")].sort(
          (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
        )
      );
    });

    setLoading(false);

    // Cleanup listeners on unmount
    return () => {
      unsubscribeOrders();
      unsubscribeReviews();
    };
  }, [user]);

  const value = {
    metrics,
    activities,
    loading,
    error,
  };

  return (
    <SellerDashboardContext.Provider value={value}>
      {children}
    </SellerDashboardContext.Provider>
  );
}

// --- Hook ---
export function useSellerDashboard(): SellerDashboardContextType {
  const context = useContext(SellerDashboardContext);
  if (context === undefined) {
    throw new Error(
      "useSellerDashboard must be used within a SellerDashboardProvider"
    );
  }
  return context;
}
