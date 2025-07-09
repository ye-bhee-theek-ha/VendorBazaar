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
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { useProducts } from "@/src/context/ProductContext";
import { useMessaging } from "@/src/context/MessagingContext"; // Import the messaging context
import {
  Product,
  ProductOption,
  ProductOptionValue,
} from "@/src/constants/types.product";

export default function ProductDetailsScreen() {
  const { pid } = useLocalSearchParams<{ pid: string }>();
  const router = useRouter();

  const { likedProductIds, toggleLikeProduct } = useAuth();
  const { addToCart } = useCart();
  const { products: contextProducts } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  // State to hold selected options, e.g., { "Size": "M", "Color": "Red" }
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: ProductOptionValue;
  }>({});

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
              condition: data.condition as "new" | "used" | "refurbished",
              imagesUrl: data.imagesURL as string[],
              description: data.description as string,
              createdAt: data.createdAt as Timestamp,
              options: data.options as ProductOption[],
              stockQuantity: data.stockQuantity as number,
              // TODO add fields to firebase
              disabled: data.disabled as boolean,
              disabledAdmin: data.disabledAdmin as boolean,
              deleted: data.deleted as boolean,
            });
          } else {
            setError("Product not found.");
          }
        } catch (err) {
          console.error("Error fetching product:", err);
          setError("Failed to load product details.");
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [pid, contextProducts]);

  const handleSelectOption = (
    optionName: string,
    value: ProductOptionValue
  ) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    // Check if all required options are selected
    if (product.options) {
      for (const option of product.options) {
        if (!selectedOptions[option.name]) {
          Alert.alert("Selection Required", `Please select a ${option.name}.`);
          return;
        }
      }
    }
    addToCart(product, 1, selectedOptions);
    Alert.alert("Success", "Added to cart!");
  };

  const handleMessageSeller = async () => {
    if (!product) return;
    // setIsCreatingConversation(true);
    router.push({
      pathname: "/(messages)/chat",
      params: {
        recipientId: product.sellerId,
        recipientName: product.sellerName,
      },
    });
  };

  const isSaved = product ? likedProductIds.includes(product.pid) : false;

  if (loading) {
    return <ActivityIndicator size="large" className="flex-1 justify-center" />;
  }

  if (error) {
    return (
      <Text className="flex-1 justify-center p-5 text-red-500">{error}</Text>
    );
  }

  if (!product) {
    return (
      <Text className="flex-1 justify-center">
        Product could not be loaded.
      </Text>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white py-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="relative items-center mb-4">
          <Image
            source={{ uri: product.imagesUrl?.[0] }}
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

        <View className="p-4">
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
              <Image
                source={{ uri: product.sellerImgUrl }}
                className="w-14 h-14 rounded-full bg-gray-200 mr-3"
              />
              <Text className="text-text font-semibold">
                {product.sellerName}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMessageSeller}
              disabled={isCreatingConversation}
              className="border border-green-600 rounded-lg px-4 py-2"
            >
              <Text className="text-green-600 font-semibold">
                {isCreatingConversation ? "Opening..." : "Message Seller"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="pl-4">
            <Text className="text-heading leading-loose font-bold text-gray-800">
              {product.name}
            </Text>
            <View className="flex-row items-center mt-1 mb-2">
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text className="text-text text-gray-700 ml-2 font-semibold">
                {product.ratingAvg}/5
              </Text>
              <Text className="text-btn_title text-gray-500 ml-2">
                ({product.totalReviews} review
                {product.totalReviews !== 1 ? "s" : ""})
              </Text>
            </View>
            <Text className="text-btn_title text-grey leading-6 mb-4">
              {product.description}
            </Text>

            {/* Dynamic Product Options */}
            {product.options?.map((option) => (
              <View key={option.name} className="mb-4">
                <Text className="text-lg font-bold mb-2">
                  Choose {option.name}
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {option.values.map((value) => (
                    <TouchableOpacity
                      key={value.name}
                      onPress={() => handleSelectOption(option.name, value)}
                      className={`min-w-[56px] h-14 rounded-lg border-2 justify-center items-center px-4 ${
                        selectedOptions[option.name] === value
                          ? "border-black bg-black"
                          : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`text-lg font-bold ${
                          selectedOptions[option.name] === value
                            ? "text-white"
                            : "text-black"
                        }`}
                      >
                        {value.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

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
