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
import { supabase } from "@/src/lib/supabase";
import { mapSupabaseToProduct } from "@/src/helpers/helper.customer";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { useTheme } from "@/src/context/ThemeContext";
import { ProductCardSkeleton } from "@/src/helpers/skeletons";

// A component for each saved item in the list
const SavedItemCard = ({
  product,
  effectiveTheme,
}: {
  product: Product;
  effectiveTheme: string;
}) => {
  const { toggleLikeProduct } = useAuth();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  return (
    <Link href={`/(customer)/home/${product.pid}`} asChild>
      <TouchableOpacity
        className="flex-1 m-1.5 border rounded-lg shadow-md"
        style={{
          backgroundColor:
            effectiveTheme === "dark" ? darkColors.input : lightColors.card,
          borderColor: colors.border,
          shadowColor: effectiveTheme === "dark" ? "#fff" : "#000",
        }}
      >
        <View>
          <View className="relative">
            <TouchableOpacity
              onPress={() => toggleLikeProduct(product.pid)}
              style={{ backgroundColor: colors.card }}
              className="absolute top-3 right-3 p-1  shadow z-10 rounded-md"
            >
              <Ionicons name={"heart"} size={24} color={"#ef4444"} />
            </TouchableOpacity>
            <Image
              source={{ uri: product.imagesUrl[0] }}
              style={{ backgroundColor: colors.border }}
              className="w-full aspect-square rounded-lg overflow-hidden"
              resizeMode="cover"
            />
          </View>

          <View className="p-3">
            <Text
              style={{ color: colors.text }}
              className="text-text font-Fredoka_Medium"
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <Text
              style={{ color: colors.secondaryText }}
              className="text-medium font-Fredoka_Regular mt-1"
            >
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
  const { effectiveTheme } = useTheme();

  // Function to fetch products in chunks of 30 (Firestore 'in' query limit)
  const fetchSavedProducts = useCallback(async () => {
    if (!likedProductIds || likedProductIds.length === 0) {
      setSavedProducts([]);
      setLoading(false);
      console.log("DEBUG: No liked products found.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("products") // Your table name
        .select("*") // Select all columns
        .in("id", likedProductIds);

      if (error) {
        throw error;
      }
      const productList = data.map(mapSupabaseToProduct);
      setSavedProducts(productList);
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
      <View style={{ flex: 1 }}>
        <FlatList
          data={Array(4).fill(0)}
          numColumns={2}
          keyExtractor={(_, index) => `skeleton-${index}`}
          renderItem={() => (
            <ProductCardSkeleton effectiveTheme={effectiveTheme} />
          )}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        />
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
    <View className="flex-1 ">
      <FlatList
        data={dataForList}
        numColumns={2}
        keyExtractor={(item) => item.pid}
        renderItem={({ item }) => {
          if ("isPlaceholder" in item) {
            return <View className="flex-1 m-1.5" />;
          }
          return (
            <SavedItemCard product={item} effectiveTheme={effectiveTheme} />
          );
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
