// src/context/ProductContext.tsx
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
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product } from "../constants/types.product";

interface ProductContextType {
  products: Product[];
  categories: { name: string; id: string }[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  loadMoreProducts: () => void;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

// --- Context Definition ---
const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PRODUCTS_PER_PAGE = 10;

// --- Provider Component ---
export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; id: string }[]>([
    { name: "all", id: "all" },
    { name: "electronics", id: "electronics" },
    { name: "clothing", id: "clothing" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // State for loading indicators
  const [loading, setLoading] = useState(true); // For initial load or category change
  const [loadingMore, setLoadingMore] = useState(false); // For pagination
  const [error, setError] = useState<string | null>(null);

  // State for pagination logic
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // TODO Effect to fetch the list of categories once

  // Effect to fetch products when the selected category changes
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasMore(true);
    setLastVisible(null);

    // console.log("Fetching products for category:", selectedCategory);

    try {
      const productsCollectionRef = collection(db, "products");
      let q = query(
        productsCollectionRef,
        orderBy("createdAt", "desc"),
        limit(PRODUCTS_PER_PAGE)
      );

      if (selectedCategory !== "all" && selectedCategory !== "") {
        q = query(
          productsCollectionRef,
          where("category", "==", selectedCategory),
          orderBy("createdAt", "desc"),
          limit(PRODUCTS_PER_PAGE)
        );
      }

      const documentSnapshots = await getDocs(q);

      const productList = documentSnapshots.docs.map((doc) => {
        const data = doc.data();
        return {
          pid: doc.id,
          name: data.name as string,
          category: data.category as string,
          price: data.price as number,
          sellerId: data.sellerId as string,
          sellerName: data.sellerName as string,
          sellerImgUrl: data.sellerImgUrl as string,
          totalReviews: data.totalReviews as number,
          ratingAvg: data.ratingAvg as number,
          condition: data.condition as String,
          imagesUrl: data.imagesURL as string[],
          description: data.description as string,
          createdAt: data.createdAt as Timestamp,
        } as Product;
      }) as Product[];

      setProducts(productList);
      // console.log("Fetched length products:", productList.length);

      // console.log("Products fetched:", productList);

      // Set the last visible document for pagination
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc);

      // Check if there are more products
      if (documentSnapshots.docs.length < PRODUCTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setError("Could not load products. Please check your connection.");
      // IMPORTANT: Firestore may require a composite index for this query.
      // The error message in your console will include a link to create it.
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Function to load more products for infinite scroll
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const productsCollectionRef = collection(db, "products");
      let q = query(
        productsCollectionRef,
        orderBy("createdAt", "desc"),
        startAfter(lastVisible), // Start after the last fetched document
        limit(PRODUCTS_PER_PAGE)
      );

      if (selectedCategory !== "All") {
        q = query(
          productsCollectionRef,
          where("category", "==", selectedCategory),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(PRODUCTS_PER_PAGE)
        );
      }

      const documentSnapshots = await getDocs(q);
      const newProductList = documentSnapshots.docs.map((doc) => ({
        pid: doc.id,
        ...doc.data(),
      })) as Product[];

      // Append new products to the existing list
      setProducts((prevProducts) => [...prevProducts, ...newProductList]);

      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc);

      if (documentSnapshots.docs.length < PRODUCTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more products:", err);
      setError("Could not load more products.");
    } finally {
      setLoadingMore(false);
    }
  };

  const contextValue = {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    loadMoreProducts,
    loading,
    loadingMore,
    error,
    hasMore,
    filteredProducts: products, // For compatibility, though filtering is now server-side
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts(): ProductContextType {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
