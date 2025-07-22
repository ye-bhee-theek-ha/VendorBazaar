// src/context/seller/SellerOrderContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot, // Import onSnapshot
  limit,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  doc,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "../AuthContext";
import { Order, OrderStatus } from "@/src/constants/types.order";
import { statusToAnalyticsKey } from "@/src/helpers/helper";

interface SellerOrderContextType {
  newOrders: Order[];
  shippedOrders: Order[];
  completedOrders: Order[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  handleUpdateStatus: (
    orderId: string,
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ) => Promise<void>;
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

  // useEffect now sets up the real-time listener
  useEffect(() => {
    if (!user || user.role !== "seller") {
      setAllOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ordersCollectionRef = collection(db, "orders");
    const q = query(
      ordersCollectionRef,
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(ORDERS_PER_PAGE)
    );

    // onSnapshot returns an unsubscribe function
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const orders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        setAllOrders(orders);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === ORDERS_PER_PAGE);
        setLoading(false);
      },
      (err) => {
        console.error("Seller orders listener error:", err);
        setError("Could not load your orders.");
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [user]); // Re-run effect if the user changes

  // loadMoreOrders remains the same, using getDocs for pagination
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

  const handleUpdateStatus = async (
    orderId: string,
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ) => {
    // The loading state here is for the update operation itself
    if (!user) return;

    const currentStatusKey = statusToAnalyticsKey(currentStatus);
    const newStatusKey = statusToAnalyticsKey(newStatus);

    const orderRef = doc(db, "orders", orderId);
    const sellerRef = doc(db, "sellers", user.uid);
    const batch = writeBatch(db);

    try {
      batch.update(orderRef, { status: newStatus });
      batch.update(sellerRef, {
        [`orderStatusCounts.${currentStatusKey}`]: increment(-1),
        [`orderStatusCounts.${newStatusKey}`]: increment(1),
      });

      await batch.commit();
    } catch (err) {
      setError("Failed to update order status.");
      console.error("Failed to update order status:", err);
    }
  };

  const { newOrders, shippedOrders, completedOrders } = useMemo(() => {
    // This filtering logic remains the same
    const newO: Order[] = [];
    const proc: Order[] = [];
    const ship: Order[] = [];
    const comp: Order[] = [];

    allOrders.forEach((order) => {
      switch (order.status) {
        case "paid":
        case "Processing":
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
          proc.push(order); // Assuming you might want to handle other statuses
          break;
      }
    });

    return {
      newOrders: newO,
      shippedOrders: ship,
      completedOrders: comp,
    };
  }, [allOrders]);

  const value = {
    newOrders,
    shippedOrders,
    completedOrders,
    // Note: 'loading' now primarily reflects the initial real-time load
    loading,
    loadingMore,
    hasMore,
    error,
    handleUpdateStatus,
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
