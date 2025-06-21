// src/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  collection,
  onSnapshot,
  query,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { CartItem, Product } from "../constants/types.product";

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  cartSubtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const cartCollectionRef = collection(db, "users", user.uid, "cart");
    const q = query(cartCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as CartItem[];
        setCartItems(items);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to fetch cart items:", err);
        setError("Could not load your cart.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addToCart = async (product: Product, quantity: number) => {
    if (!user) {
      setError("You must be logged in to add items to the cart.");
      return;
    }
    const cartItemRef = doc(db, "users", user.uid, "cart", product.pid);
    try {
      const newItem: CartItem = {
        ...product,
        quantity: quantity,
      };
      await setDoc(cartItemRef, newItem, { merge: true });
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Could not add item to cart.");
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!user) return;
    const cartItemRef = doc(db, "users", user.uid, "cart", productId);
    try {
      if (newQuantity > 0) {
        await updateDoc(cartItemRef, { quantity: newQuantity });
      } else {
        // If quantity is 0 or less, remove the item
        await removeFromCart(productId);
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Could not update item quantity.");
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const cartItemRef = doc(db, "users", user.uid, "cart", productId);
    try {
      await deleteDoc(cartItemRef);
    } catch (err) {
      console.error("Error removing from cart:", err);
      setError("Could not remove item from cart.");
    }
  };

  const cartSubtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const value = {
    cartItems,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
