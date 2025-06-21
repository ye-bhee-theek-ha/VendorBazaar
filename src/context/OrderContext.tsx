// src/context/OrderContext.tsx
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
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { Product } from "../constants/types.product";
import { Order } from "../constants/types.order";

// --- Interfaces ---

interface OrderContextType {
  ongoingOrders: Order[];
  completedOrders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ongoingOrders, setOngoingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processOrders = useCallback((allOrders: Order[]) => {
    const ongoing = allOrders.filter(
      (o) => o.status !== "Completed" && o.status !== "Cancelled"
    );
    const completed = allOrders.filter(
      (o) => o.status === "Completed" || o.status === "Cancelled"
    );

    setOngoingOrders(ongoing);
    setCompletedOrders(completed);
  }, []);

  const refetch = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const ordersCollectionRef = collection(db, "users", user.uid, "orders");
      const q = query(ordersCollectionRef, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(q);
      const allOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      processOrders(allOrders);
    } catch (err) {
      console.error("Failed to refetch orders:", err);
      setError("Could not refresh your orders.");
    }
  }, [user, processOrders]);

  useEffect(() => {
    if (!user) {
      setOngoingOrders([]);
      setCompletedOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersCollectionRef = collection(db, "users", user.uid, "orders");
    const q = query(ordersCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        processOrders(allOrders);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to fetch orders:", err);
        setError("Could not load your orders.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, processOrders]);

  const value = {
    ongoingOrders,
    completedOrders,
    loading,
    error,
    refetch,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrders(): OrderContextType {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
