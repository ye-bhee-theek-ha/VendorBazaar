// app/(customer)/index.tsx

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useProducts } from "@/src/context/ProductContext";
import { Product } from "@/src/constants/types.product";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { useMemo } from "react";

export type ListItem = Product | { pid: string; isPlaceholder: true };

const CategoryFilters = () => {
  const { categories, selectedCategory, setSelectedCategory, loading } =
    useProducts();

  if (loading && categories.length <= 1) {
    return (
      <View className="h-[50px] justify-center items-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="pt-2 pb-3 ">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setSelectedCategory(category.name)}
            className={`px-5 py-2.5 rounded-xl mr-3 border border-black/15 ${
              selectedCategory === category.name ? "bg-black" : "bg-white/50"
            }`}
          >
            <Text
              className={`font-normal text-medium ${
                selectedCategory === category.name ? "text-white" : "text-black"
              }`}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const ProductCard = ({ product }: { product: Product }) => {
  const { likedProductIds, toggleLikeProduct } = useAuth();

  const isSaved = likedProductIds.includes(product.pid);

  const handleSavePress = () => {
    toggleLikeProduct(product.pid);
  };

  return (
    <Link href={`/(customer)/home/${product.pid}`} asChild>
      <TouchableOpacity className="flex-1 m-1.5">
        <View className="">
          <View className="relative">
            <TouchableOpacity
              onPress={handleSavePress}
              className="absolute top-3 right-3 p-1 rounded-lg bg-white shadow z-10"
            >
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={24}
                color={isSaved ? "#ef4444" : "black"}
              />
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

const ListFooter = () => {
  const { loadingMore, hasMore } = useProducts();
  if (loadingMore) {
    return (
      <View className="p-10 justify-center items-center">
        <ActivityIndicator size="small" />
      </View>
    );
  }
  if (!hasMore) {
    return (
      <View className="p-10 justify-center items-center">
        <Text className="text-gray-500">You've reached the end!</Text>
      </View>
    );
  }
  return <View className="h-20" />; // Add space at the bottom
};

const SearchAndFilter = () => (
  <View className="flex-row items-center p-4 pt-2  gap-x-3">
    <View className="flex-1 flex-row items-center border border-black/15 rounded-lg px-3">
      <Ionicons name="search" size={20} color="gray" />
      <TextInput
        placeholder="Search for clothes..."
        className="flex-1 h-12 ml-2 text-base"
        placeholderTextColor="gray"
      />
      {/* <Ionicons name="mic" size={22} color="gray" /> */}
    </View>
    <TouchableOpacity className="p-3 bg-black rounded-lg">
      <Ionicons name="options" size={24} color="white" />
    </TouchableOpacity>
  </View>
);

export default function CustomerHomeScreen() {
  const { products, loading, error, loadMoreProducts, hasMore } = useProducts();
  const { user, loading: authLoading } = useAuth();

  const dataForList: ListItem[] = useMemo(() => {
    if (products.length % 2 !== 0) {
      return [...products, { isPlaceholder: true, pid: "placeholder-item" }];
    }
    return products;
  }, [products]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center p-5">
        <Ionicons name="cloud-offline-outline" size={40} color="red" />
        <Text className="text-red-500 text-center mt-4">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 flex justify-start mt-2">
      <FlatList
        data={loading ? [] : dataForList}
        keyExtractor={(item, index) => `${item.pid}-${index}`}
        numColumns={2}
        className=""
        renderItem={({ item }) => {
          if ("isPlaceholder" in item) {
            return <View className="flex-1 m-1.5" />;
          }
          return <ProductCard product={item} />;
        }}
        ListHeaderComponent={
          <>
            <SearchAndFilter />
            <CategoryFilters />
          </>
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="flex-1 justify-center items-center mt-20 p-5">
              <Ionicons name="file-tray-outline" size={50} color="gray" />
              <Text className="text-gray-600 mt-4 text-center">
                No products found in this category.
              </Text>
            </View>
          )
        }
        ListFooterComponent={ListFooter}
        onEndReached={() => {
          if (hasMore && !loading) {
            loadMoreProducts();
          }
        }}
        onEndReachedThreshold={0.7}
        showsVerticalScrollIndicator={false}
        // ListHeaderComponentStyle={loading ? { display: "none" } : {}}
        // ListFooterComponentStyle={loading ? { display: "none" } : {}}
        // className={loading ? "hidden" : "flex"}
        contentContainerClassName="mx-4"
      />
      {loading && (
        <View className="absolute inset-0 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}
