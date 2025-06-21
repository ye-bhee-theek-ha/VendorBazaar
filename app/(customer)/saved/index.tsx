// app/(customer)/saved.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/lib/firebase";
import {
  collection,
  query,
  where,
  documentId,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { Product } from "@/src/constants/types.product";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { ListItem } from "../home";

// A component for each saved item in the list
const SavedItemCard = ({ product }: { product: Product }) => {
  const { toggleLikeProduct } = useAuth();
  return (
    <Link href={`/(customer)/home/${product.pid}`} asChild>
      <TouchableOpacity className="flex-1 m-1.5">
        <View className="">
          <View className="relative">
            <TouchableOpacity
              onPress={() => toggleLikeProduct(product.pid)}
              className="absolute top-3 right-3 p-1 rounded-lg bg-white shadow z-10"
            >
              <Ionicons name={"heart"} size={24} color={"#ef4444"} />
            </TouchableOpacity>
            <Image
              source={{
                uri: product.imagesUrl[0],
              }}
              className="w-full aspect-square rounded-lg overflow-hidden"
              resizeMode="cover"
            />
          </View>

          <View className="p-3">
            <Text
              className="text-btn_title font-bold text-black"
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <Text className="text-sm font-medium text-grey mt-1">
              ${product.price.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default function SavedItemsScreen() {
  const { likedProductIds } = useAuth();
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch products in chunks of 30 (Firestore 'in' query limit)
  const fetchSavedProducts = useCallback(async () => {
    if (!likedProductIds || likedProductIds.length === 0) {
      setSavedProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allFetchedProducts: Product[] = [];
      // Chunk the savedProductIds array into groups of 30
      for (let i = 0; i < likedProductIds.length; i += 30) {
        const chunk = likedProductIds.slice(i, i + 30);
        if (chunk.length > 0) {
          const productsRef = collection(db, "products");
          const q = query(productsRef, where(documentId(), "in", chunk));
          const querySnapshot = await getDocs(q);
          const chunkProducts = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              pid: doc.id,
              name: data.name as string,
              category: data.category as string,
              price: data.price as number,
              sellerId: data.sellerId as string,
              sellerName: data.sellerName as string,
              avgRating: data.avgRating as number,
              condition: data.condition as String,
              imagesUrl: data.imagesURL as string[],
              description: data.description as string,
              createdAt: data.createdAt as Timestamp,
            } as Product;
          }) as Product[];
          allFetchedProducts.push(...chunkProducts);
        }
      }
      setSavedProducts(allFetchedProducts);
    } catch (err) {
      console.error("Failed to fetch saved products:", err);
      console.log(likedProductIds);
      setError("Could not load your saved items. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [likedProductIds]);

  useEffect(() => {
    fetchSavedProducts();
  }, [fetchSavedProducts]);

  const dataForList: ListItem[] = useMemo(() => {
    if (savedProducts.length % 2 !== 0) {
      return [
        ...savedProducts,
        { isPlaceholder: true, pid: "placeholder-item" },
      ];
    }
    return savedProducts;
  }, [savedProducts]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-gray-50">
        <Ionicons name="cloud-offline-outline" size={40} color="red" />
        <Text className="text-red-500 text-center mt-4">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={dataForList}
        numColumns={2}
        keyExtractor={(item) => item.pid}
        renderItem={({ item }) => {
          if ("isPlaceholder" in item) {
            return <View className="flex-1 m-1.5" />;
          }
          return <SavedItemCard product={item} />;
        }}
        contentContainerStyle={{ paddingTop: 10 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-32 p-5">
            <View className="p-5 bg-gray-200 rounded-full mb-4">
              <Ionicons name="heart-outline" size={40} color="gray" />
            </View>
            <Text className="text-xl font-bold text-gray-700">
              No Saved Items!
            </Text>
            <Text className="text-base text-gray-500 mt-2 text-center">
              You don't have any saved items. Go to home and add some.
            </Text>
          </View>
        }
      />
    </View>
  );
}
