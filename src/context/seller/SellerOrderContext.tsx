// src/context/seller/SellerOrderContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
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
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "../AuthContext";
import { Order } from "@/src/constants/types.order";

interface SellerOrderContextType {
  newOrders: Order[];
  processingOrders: Order[];
  shippedOrders: Order[];
  completedOrders: Order[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMoreOrders: () => Promise<void>;
}

const SellerOrderContext = createContext<SellerOrderContextType | undefined>(
  undefined
);

const ORDERS_PER_PAGE = 15;

export function SellerOrderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchInitialOrders = useCallback(async () => {
    if (!user || user.role !== "seller") {
      setAllOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasMore(true);
    setError(null);

    try {
      const ordersCollectionRef = collection(db, "orders");
      const q = query(
        ordersCollectionRef,
        where("sellerId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(ORDERS_PER_PAGE)
      );

      const documentSnapshots = await getDocs(q);
      const orders = documentSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      setAllOrders(orders);
      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      if (documentSnapshots.docs.length < ORDERS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch initial seller orders:", err);
      setError("Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialOrders();
  }, [fetchInitialOrders]);

  const loadMoreOrders = async () => {
    if (!user || loadingMore || !hasMore || !lastVisible) return;

    setLoadingMore(true);
    try {
      const ordersCollectionRef = collection(db, "orders");
      const q = query(
        ordersCollectionRef,
        where("sellerId", "==", user.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(ORDERS_PER_PAGE)
      );

      const documentSnapshots = await getDocs(q);
      const newOrders = documentSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      setAllOrders((prev) => [...prev, ...newOrders]);
      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      if (documentSnapshots.docs.length < ORDERS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more seller orders:", err);
      setError("Could not load more orders.");
    } finally {
      setLoadingMore(false);
    }
  };

  const { newOrders, processingOrders, shippedOrders, completedOrders } =
    useMemo(() => {
      // This filtering logic remains the same and works on the full paginated list
      const newO: Order[] = [];
      const proc: Order[] = [];
      const ship: Order[] = [];
      const comp: Order[] = [];

      allOrders.forEach((order) => {
        switch (order.status) {
          case "Packing":
            newO.push(order);
            break;
          case "In Transit":
            ship.push(order);
            break;
          case "Completed":
          case "Cancelled":
            comp.push(order);
            break;
          default:
            proc.push(order);
            break;
        }
      });

      return {
        newOrders: newO,
        processingOrders: proc,
        shippedOrders: ship,
        completedOrders: comp,
      };
    }, [allOrders]);

  const value = {
    newOrders,
    processingOrders,
    shippedOrders,
    completedOrders,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMoreOrders,
  };

  return (
    <SellerOrderContext.Provider value={value}>
      {children}
    </SellerOrderContext.Provider>
  );
}

export function useSellerOrders(): SellerOrderContextType {
  const context = useContext(SellerOrderContext);
  if (context === undefined) {
    throw new Error(
      "useSellerOrders must be used within a SellerOrderProvider"
    );
  }
  return context;
}
