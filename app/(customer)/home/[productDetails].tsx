// app/(tabs)/home/[productDetails].tsx
import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductDetailsScreen() {
  const { productDetails: productId } = useLocalSearchParams<{
    productDetails: string;
  }>();
  const router = useRouter();

  // In a real app, fetch product details using productId
  const product = {
    id: productId,
    name: `Product ${productId}`,
    description:
      "This is a detailed description of the product. It is of high quality and has many features that you will love. Buy it now!",
    price: Math.floor(Math.random() * 100 + 20).toFixed(2), // Random price
    seller: "Awesome Seller Inc.",
    rating: (Math.random() * 2 + 3).toFixed(1), // Random rating 3-5
    reviews: Math.floor(Math.random() * 100 + 10),
    images: [
      "https://placehold.co/600x400/E0E0E0/B0B0B0?text=Product+Image+1",
      "https://placehold.co/600x400/D0D0D0/A0A0A0?text=Product+Image+2",
      "https://placehold.co/600x400/C0C0C0/909090?text=Product+Image+3",
    ],
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: product.name,
          // The header is managed by (tabs)/_layout.tsx by default,
          // but can be overridden here if needed.
          // headerShown: true, // Ensure header is shown if not by default from tab layout
          // headerLeft: () => (
          //   <TouchableOpacity onPress={() => router.back()} className="ml-2">
          //     <Ionicons name="arrow-back" size={24} color="black" />
          //   </TouchableOpacity>
          // ),
        }}
      />
      <ScrollView className="flex-1">
        {/* Image Carousel Placeholder */}
        <View className="h-64 bg-gray-200 items-center justify-center">
          <Image
            source={{ uri: product.images[0] }}
            className="w-full h-full"
            resizeMode="cover"
            onError={(e: any) =>
              console.log("Image load error:", e.nativeEvent.error)
            }
          />
          {/* Basic image indicator */}
          <View className="absolute bottom-2 flex-row space-x-2">
            {product.images.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === 0 ? "bg-blue-500" : "bg-gray-400"
                }`}
              />
            ))}
          </View>
        </View>

        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-800 mb-1">
            {product.name}
          </Text>
          <Text className="text-xl font-semibold text-blue-600 mb-2">
            ${product.price}
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text className="text-gray-700 ml-1">
              {product.rating} ({product.reviews} reviews)
            </Text>
          </View>

          <Text className="text-gray-600 text-sm mb-3">
            Sold by:{" "}
            <Text className="font-semibold text-blue-500">
              {product.seller}
            </Text>
          </Text>

          <Text className="text-lg font-semibold text-gray-800 mt-3 mb-1">
            Description
          </Text>
          <Text className="text-base text-gray-700 leading-relaxed">
            {product.description}
          </Text>

          {/* Variants, Quantity, etc. would go here */}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="border-t border-gray-200 p-4 flex-row justify-between items-center bg-white">
        <TouchableOpacity className="border border-blue-500 rounded-lg py-3 px-6">
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={24}
            color="#3b82f6"
          />
        </TouchableOpacity>
        <TouchableOpacity className="bg-blue-600 rounded-lg py-3 px-8 flex-1 ml-3 items-center">
          <Text className="text-white text-lg font-semibold">Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
