// app/(customer)/home/[pid].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Product } from "@/src/constants/types.product";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { useProducts } from "@/src/context/ProductContext";

const SIZES = ["S", "M", "L", "XL"]; // Example sizes

export default function ProductDetailsScreen() {
  const { pid } = useLocalSearchParams<{ pid: string }>();
  const router = useRouter();

  const { likedProductIds, toggleLikeProduct } = useAuth();
  const { addToCart } = useCart();
  const { products: contextProducts } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (!pid) {
      setLoading(false);
      return;
    }

    const productFromContext = contextProducts.find((item) => item.pid === pid);

    if (productFromContext) {
      setProduct(productFromContext);
      setLoading(false);
    } else {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          const productRef = doc(db, "products", pid);
          const docSnap = await getDoc(productRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setProduct({
              pid: docSnap.id,
              name: data.name as string,
              category: data.category as string,
              price: data.price as number,
              sellerId: data.sellerId as string,
              sellerName: data.sellerName as string,
              sellerImgUrl: data.sellerImgUrl as string,
              totalReviews: data.totalReviews as number,
              ratingAvg: data.avgRating as number,
              condition: data.condition as String,
              imagesUrl: data.imagesURL as string[],
              description: data.description as string,
              createdAt: data.createdAt as Timestamp,
            } as Product);
          } else {
            setError("Product not found.");
            setProduct(null);
          }
        } catch (err) {
          console.error("Error fetching product:", err);
          setError("Failed to load product details.");
          setProduct(null);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [pid, contextProducts]); // Add contextProducts to the dependency array

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      alert("Please select a size."); // TODO: A more elegant toast/modal is better for production
      return;
    }
    // Assuming quantity is 1 for now. This can be extended with a quantity selector.
    addToCart(product, 1);
    // Optionally navigate to cart or show a confirmation message
    alert("Added to cart!");
  };

  const isSaved = product ? likedProductIds.includes(product.pid) : false;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Product could not be loaded.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white py-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image and Save Button */}
        <View className="relative items-center mb-4">
          <Image
            source={{
              uri: product.imagesUrl?.[0],
            }}
            className="w-[90%] aspect-square rounded-lg"
          />
          <TouchableOpacity
            onPress={() => toggleLikeProduct(product.pid)}
            className="absolute top-4 right-8 bg-white/80 p-2.5 rounded-lg z-10"
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={24}
              color={isSaved ? "#ef4444" : "black"}
            />
          </TouchableOpacity>
        </View>

        {/* Main Details Section */}
        <View className="p-4">
          {/* Seller Info */}
          <View className="flex-row justify-between items-center mb-3">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() =>
                router.push({
                  pathname: "/(customer)/home/seller/[sellerId]",
                  params: { sellerId: product.sellerId },
                })
              }
            >
              <View className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 mr-3">
                <Image
                  source={{ uri: product.sellerImgUrl }}
                  className="w-full aspect-square"
                />
              </View>
              <View>
                <Text className="text-text font-semibold">
                  {product.sellerName}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="border border-green-600 rounded-lg px-4 py-2">
              <Text className="text-green-600 font-semibold">
                Message Sellerr
              </Text>
            </TouchableOpacity>
          </View>
          <View className="pl-4">
            {/* Product Name and Rating */}
            <Text className="text-heading leading-loose font-bold text-gray-800">
              {product.name}
            </Text>
            <View className="flex-row items-center mt-1 mb-2">
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text className="text-text text-gray-700 ml-2 font-semibold">
                {product.ratingAvg}/5
                {/* //maybe change to float TODO */}
              </Text>
              <Text className="text-btn_title text-gray-500 ml-2">
                ({product.totalReviews} review
                {product.totalReviews > 1 ? "s" : ""})
              </Text>
            </View>
            {/* Description */}
            <Text className="text-btn_title text-grey leading-6 mb-4">
              {product.description}
            </Text>

            {/* Size Selector//TODO  Options */}
            <Text className="text-lg font-bold mb-2">Choose size</Text>
            <View className="flex-row gap-x-3">
              {SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  className={`w-14 h-14 rounded-lg border-2 justify-center items-center ${
                    selectedSize === size
                      ? "border-black bg-black"
                      : "border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-lg font-bold ${
                      selectedSize === size ? "text-white" : "text-black"
                    }`}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="flex-row items-center p-4 border-t border-gray-200 bg-white">
        <View>
          <Text className="text-sm text-gray-500">Price</Text>
          <Text className="text-2xl font-bold">
            ${product.price.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddToCart}
          className="flex-1 bg-primary rounded-lg p-4 flex-row justify-center items-center ml-4"
        >
          <Ionicons name="cart-outline" size={22} color="white" />
          <Text className="text-white text-base font-bold ml-2">
            Add to Cart
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
