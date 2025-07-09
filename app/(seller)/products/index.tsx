// app/(seller)/products/index.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSellerProducts } from "@/src/context/seller/SellerProductContext";
import { Product } from "@/src/constants/types.product";

const ProductListItem = ({ item }: { item: Product }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(seller)/products/${item.pid}`)}
      className="flex-row mx-6 my-2 rounded-lg border items-center bg-white p-3 shadow-sm"
      style={{ elevation: 1, borderColor: "#e0e0e0" }}
    >
      <Image
        source={{ uri: item.imagesUrl?.[0] }}
        className="w-20 h-20 rounded-md mr-4"
      />
      <View className="flex-1 flex flex-row justify-between ">
        <View
          style={{
            flex: 1,
            maxWidth: "70%",
            justifyContent: "space-between",
            paddingRight: 10,
            gap: 2,
          }}
        >
          <Text className="text-btn_title font-semibold" numberOfLines={1}>
            {item.name}
          </Text>

          <Text className="text-sm text-gray-600" numberOfLines={2}>
            {item.category || "No category."}
          </Text>

          <Text className="text-btn_title font-bold text-primary mt-1">
            ${item.price.toFixed(2)}
          </Text>
        </View>

        <Text className="text-sm text-gray-500 h-full self-end mr-4">
          Stock: {item.stockQuantity}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="gray" />
    </TouchableOpacity>
  );
};

export default function SellerProductsScreen() {
  const { products, loading, error, fetchProducts } = useSellerProducts();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setIsRefreshing(false);
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: "My Products",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/(seller)/products/add")}
              className="mr-4"
            >
              <Ionicons name="add-circle" size={28} color="#0b6623" />
            </TouchableOpacity>
          ),
        }}
      />
      {loading && products.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductListItem item={item} />}
          keyExtractor={(item) => item.pid}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="cube-outline" size={50} color="gray" />
              <Text className="text-lg font-bold mt-4">No Products Yet</Text>
              <Text className="text-gray-500 mt-1">
                Tap the '+' to add your first product.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}
