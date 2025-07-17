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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useProducts } from "@/src/context/ProductContext";
import { Product } from "@/src/constants/types.product";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { useMemo } from "react";
import { useTheme } from "@/src/context/ThemeContext";
import { lightColors, darkColors } from "@/src/constants/Colors";
import { ErrorState, ProductCardSkeleton } from "@/src/helpers/skeletons";

export type ListItem = Product | { pid: string; isPlaceholder: true };

const CategoryFilters = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const { categories, selectedCategory, setSelectedCategory } = useProducts();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  return (
    <View className="pt-2 pb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => {
              selectedCategory === category.name
                ? setSelectedCategory("")
                : setSelectedCategory(category.name);
            }}
            style={{
              backgroundColor:
                selectedCategory === category.name
                  ? colors.accent
                  : colors.card + "40",
              borderColor: colors.border + "60",
            }}
            className="px-5 py-2.5 rounded-2xl mr-3 border"
          >
            <Text
              style={{
                color:
                  selectedCategory === category.name ? "white" : colors.text,
              }}
              className="font-normal text-medium"
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const ProductCard = ({
  product,
  effectiveTheme,
}: {
  product: Product;
  effectiveTheme: "light" | "dark";
}) => {
  const { likedProductIds, toggleLikeProduct } = useAuth();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const isSaved = likedProductIds.includes(product.pid);

  const handleSavePress = () => {
    toggleLikeProduct(product.pid);
  };

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
              onPress={handleSavePress}
              style={{ backgroundColor: colors.card }}
              className="absolute top-3 right-3 p-1  shadow z-10 rounded-md"
            >
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={24}
                color={isSaved ? "#ef4444" : colors.text}
              />
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

const ListFooter = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const { loadingMore, hasMore } = useProducts();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  if (loadingMore) {
    return (
      <View className="p-10 justify-center items-center">
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }
  if (!hasMore) {
    return (
      <View className="p-10 justify-center items-center">
        <Text style={{ color: colors.tertiaryText }}>
          You've reached the end!
        </Text>
      </View>
    );
  }
  return <View className="h-20" />;
};

const SearchAndFilter = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  return (
    <View className="flex-row items-center p-4 pt-2 gap-x-3">
      <View
        style={{
          backgroundColor: colors.card + "60",
          borderColor: colors.border + "80",
        }}
        className="flex-1 flex-row items-center border rounded-lg px-3"
      >
        <MaterialCommunityIcons
          name="archive-search"
          size={20}
          color={colors.placeholder}
        />
        <TextInput
          placeholder="Search for clothes..."
          className="flex-1 h-12 ml-2 text-base"
          style={{ color: colors.text }}
          placeholderTextColor={colors.placeholder}
        />
      </View>
      <TouchableOpacity
        style={{ backgroundColor: colors.accent }}
        className="p-3 rounded-lg"
      >
        <Ionicons name="search" size={24} color="white" />
        {/* //TODO add onpress here */}
      </TouchableOpacity>
    </View>
  );
};

export default function CustomerHomeScreen() {
  const { products, loading, error, loadMoreProducts, hasMore, fetchProducts } =
    useProducts();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const dataForList: ListItem[] = useMemo(() => {
    if (products.length % 2 !== 0) {
      return [...products, { isPlaceholder: true, pid: "placeholder-item" }];
    }
    return products;
  }, [products]);

  if (error) {
    return (
      <ErrorState
        error={error || "Failed to load products."}
        onRetry={fetchProducts}
        effectiveTheme={effectiveTheme}
      />
    );
  }

  return (
    <View style={{ flex: 1 }} className="flex justify-start mt-2">
      <FlatList
        data={loading ? [] : products}
        keyExtractor={(item, index) => `${item.pid}-${index}`}
        numColumns={2}
        renderItem={({ item }) => {
          if ("isPlaceholder" in item) {
            return <View className="flex-1 m-1.5" />;
          }
          return <ProductCard product={item} effectiveTheme={effectiveTheme} />;
        }}
        ListHeaderComponent={
          <>
            <SearchAndFilter effectiveTheme={effectiveTheme} />
            <CategoryFilters effectiveTheme={effectiveTheme} />
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ flex: 1 }}>
              <FlatList
                data={Array(6).fill(0)} // Render 6 skeleton items
                numColumns={2}
                keyExtractor={(_, index) => `skeleton-${index}`}
                renderItem={() => (
                  <ProductCardSkeleton effectiveTheme={effectiveTheme} />
                )}
                contentContainerStyle={{ paddingHorizontal: 8 }}
              />
            </View>
          ) : (
            <View className="flex-1 justify-center items-center mt-20 p-5">
              <Ionicons
                name="file-tray-outline"
                size={50}
                color={colors.tertiaryText}
              />
              <Text
                style={{ color: colors.secondaryText }}
                className="mt-4 text-center"
              >
                No products found in this category.
              </Text>
            </View>
          )
        }
        ListFooterComponent={<ListFooter effectiveTheme={effectiveTheme} />}
        onEndReached={() => {
          if (hasMore && !loading) {
            loadMoreProducts();
          }
        }}
        onEndReachedThreshold={0.7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
      {/* {loading && (
        <View
          className="absolute inset-0 justify-center items-center"
          style={{ backgroundColor: `${colors.background}99` }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )} */}
    </View>
  );
}
