// src/context/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import {
  CartItem,
  Product,
  ProductOptionValue,
} from "../constants/types.product";
import { usePaystack } from "react-native-paystack-webview";
import { Alert } from "react-native";

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (
    product: Product,
    quantity: number,
    selectedOptions: { [key: string]: ProductOptionValue }
  ) => Promise<void>;
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  cartSubtotal: number;
  totalItems: number;
  initiatePayment: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Paystack for payment processing
  const { popup } = usePaystack();

  const paystackConfig = {
    email: user?.email || "",
    amount: 100,
    currency: "NGN",
    reference: `cart-${Date.now()}`,
    metadata: {
      custom_fields: [
        {
          display_name: "Cart Items",
          variable_name: "cart_items",
          value: JSON.stringify(cartItems),
        },
      ],
    },
    onSuccess: async (res: any) => {
      console.log("Payment successful:", res);
      // Handle successful payment logic here
    },
    onCancel: () => {
      console.log("Payment cancelled");
      // Handle payment cancellation logic here
    },
    onError: (err: any) => {
      console.error("Payment error:", err);
      setError("Payment failed. Please try again.");
    },
    onload: (res: any) => {
      console.log("Paystack popup loaded: ", res);
    },
  };

  const initiatePayment = () => {
    if (!user) {
      Alert.alert(
        "Authentication Error",
        "You must be logged in to make a payment."
      );
      return;
    }
    const SHIPPING_FEE = 80.0;
    const totalAmount = cartSubtotal + SHIPPING_FEE;

    popup.newTransaction({
      email: user.email || "",
      amount: totalAmount * 100,
      reference: `cart-${Date.now()}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Cart Items",
            variable_name: "cart_items",
            value: JSON.stringify(
              cartItems.map((item) => ({
                name: item.name,
                quantity: item.quantity,
              }))
            ),
          },
        ],
      },
      onSuccess: async (res: any) => {
        console.log("Payment successful:", res);
        // TODO: Create order in Firestore, clear cart, etc.
        Alert.alert("Payment Successful", "Your order has been placed!");
        // router.replace("/(customer)/home");
      },
      onCancel: () => {
        console.log("Payment cancelled");
        Alert.alert(
          "Payment Cancelled",
          "You have cancelled the payment process."
        );
      },
      onError: (err: any) => {
        console.error("Payment error:", err);
        Alert.alert(
          "Payment Error",
          "An error occurred during payment. Please try again."
        );
      },
    });
  };

  // fetch cart items when user changes or mounts
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

  const addToCart = async (
    product: Product,
    quantity: number,
    selectedOptions: { [key: string]: ProductOptionValue }
  ) => {
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
    initiatePayment,
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
