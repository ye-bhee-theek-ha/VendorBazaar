// app/(customer)/cart.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useCart } from "@/src/context/CartContext";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CartItem } from "@/src/constants/types.product";

const CartListItem = ({ item }: { item: CartItem }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <View className="flex-row items-center bg-white p-3 rounded-lg border border-gray-200 mb-3 mx-4">
      <Image
        source={{ uri: item.imagesUrl?.[0] || "https://placehold.co/100x100" }}
        className="w-20 h-20 rounded-md mr-4"
      />
      <View className="flex-1">
        <Text className="text-base font-semibold" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-sm text-gray-500 mb-1">Size L</Text>{" "}
        {/* This should be a dynamic option later */}
        <Text className="text-lg font-bold">${item.price.toFixed(2)}</Text>
      </View>
      <View className="items-center">
        <TouchableOpacity
          onPress={() => removeFromCart(item.pid)}
          className="self-end mb-2"
        >
          <Ionicons name="trash-bin-outline" size={20} color="red" />
        </TouchableOpacity>
        <View className="flex-row items-center bg-gray-100 rounded-full">
          <TouchableOpacity
            onPress={() => updateQuantity(item.pid, item.quantity - 1)}
            className="p-2"
          >
            <Ionicons name="remove" size={18} />
          </TouchableOpacity>
          <Text className="px-3 text-base font-semibold">{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.pid, item.quantity + 1)}
            className="p-2"
          >
            <Ionicons name="add" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function CartScreen() {
  const { cartItems, loading, error, cartSubtotal } = useCart();
  const router = useRouter();

  const SHIPPING_FEE = 80.0; // Example shipping fee
  const VAT_RATE = 0.0; // Example VAT
  const total = cartSubtotal * (1 + VAT_RATE) + SHIPPING_FEE;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: "My Cart",
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-4">
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity className="mr-4">
              <Ionicons name="notifications-outline" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="cart-outline" size={60} color="gray" />
          <Text className="text-xl font-bold mt-4">Your Cart is Empty</Text>
          <Text className="text-gray-500 mt-2">
            Looks like you haven't added anything yet.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={cartItems}
            renderItem={({ item }) => <CartListItem item={item} />}
            keyExtractor={(item) => item.pid}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 250 }} // Padding to not hide last item
          />
          {/* Summary Section */}
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pt-5 rounded-t-2xl">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-base">Sub-total</Text>
              <Text className="text-gray-800 font-semibold text-base">
                ${cartSubtotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-base">VAT (%)</Text>
              <Text className="text-gray-800 font-semibold text-base">
                ${(cartSubtotal * VAT_RATE).toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-600 text-base">Shipping fee</Text>
              <Text className="text-gray-800 font-semibold text-base">
                ${SHIPPING_FEE.toFixed(2)}
              </Text>
            </View>
            <View className="h-px bg-gray-200 my-2" />
            <View className="flex-row justify-between mt-2 mb-5">
              <Text className="text-gray-800 text-lg font-bold">Total</Text>
              <Text className="text-gray-800 font-bold text-lg">
                ${total.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity className="bg-black rounded-full p-4 flex-row justify-center items-center">
              <Text className="text-white text-lg font-semibold">
                Go To Checkout
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="white"
                className="ml-2"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
